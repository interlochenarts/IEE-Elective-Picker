import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import {Education} from '../classes/education';
import {ElectiveCriterion} from '../classes/elective-criterion';
import * as cometd from 'cometd/cometd';
import {FilterListItem} from '../classes/filter-list-item';

declare const Visualforce: any;

@Injectable()
export class ElectiveDataService {
  public education = new BehaviorSubject<Education>(new Education());
  public educationId = new BehaviorSubject<string>(null);
  public electiveCriteria = new BehaviorSubject<Map<string, ElectiveCriterion[]>>(null);
  public closedTypes = new BehaviorSubject<string[]>([]);
  public availableCriteria = new BehaviorSubject<number>(0);
  public availableCriteriaBySession = new BehaviorSubject<Map<string, number>>(null);
  public closedPeriods = new BehaviorSubject<number[]>([]);
  public activeProgramMajorId = new BehaviorSubject<string>(null);
  public typeFilterList = new BehaviorSubject<FilterListItem[]>([]);

  constructor() {
    this.educationId.asObservable().subscribe({
      next: edId => {
        this.getEducation(edId);
      }
    });

    Visualforce.remoting.Manager.invokeAction(
      'IEE_ElectivePicker_Controller.getSessionId',
      (sessionId, event) => {
        // console.log(event);
        // console.log('sessionId: ' + sessionId);
        // cometD calls
        const cometD = new cometd.CometD();
        cometD.configure({
          url: window.location.protocol + '//' + window.location.hostname + '/cometd/41.0',
          requestHeaders: {Authorization: 'OAuth ' + sessionId},
          appendMessageTypeToURL: false
        });
        cometD.websocketEnabled = false;

        cometD.handshake(h => {
          const ev = '/event/Camp_Elective_Enrollment_Change__e';
          // console.log(h);
          if (h.successful) {
            // console.log('subscribing to ' + ev);
            cometD.subscribe(ev, message => {
              // console.log('comet message');
              // console.log(message.data.payload);
              const electives = this.education.getValue().electivesByProgramMajorIds[this.activeProgramMajorId.getValue()];
              for (let i = 0; i < electives.length; i++) {
                if (message.data.payload.Elective_Id__c === electives[i].id) {
                  electives[i].enrolledCount = message.data.payload.Slots_Filled__c;
                  electives[i].isUpdating = false;
                  break;
                }
              }
            });
          } else {
            console.log('ERROR: Could not subscribe to ' + ev);
          }
        });
      },
      {buffer: false, escape: false}
    );
  }

  // gets the education record from the server
  private getEducation(edId: string): void {
    if (edId) {
      Visualforce.remoting.Manager.invokeAction(
        'IEE_ElectivePicker_Controller.getEducation',
        edId,
        json => {
          if (json !== null) {
            const ed: Education = Education.createFromJson(json);
            this.education.next(ed);
            this.getElectiveCriteria(ed.programMajorIds);
          }
        },
        {buffer: false, escape: false}
      );
    }
  }

  // gets the list of elective criteria from the server
  private getElectiveCriteria(pmIds: string[]): void {
    if (pmIds && pmIds.length > 0) {
      Visualforce.remoting.Manager.invokeAction(
        'IEE_ElectivePicker_Controller.getElectiveRequirements',
        pmIds,
        json => {
          const criteriaMap = new Map<string, ElectiveCriterion[]>();
          if (json !== null) {
            const parsedJson = JSON.parse(json);
            for (const pm in parsedJson) {
              if (parsedJson.hasOwnProperty(pm)) {
                criteriaMap.set(pm, parsedJson[pm].map(ec => {
                  return ElectiveCriterion.createFromJson(ec);
                }));
              }
            }
          }
          this.electiveCriteria.next(criteriaMap);
        },
        {buffer: false, escape: false}
      );
    }
  }
}
