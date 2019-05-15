import {Component, OnInit} from '@angular/core';
import {ElectiveDataService} from '../services/elective-data-service';
import {Education} from '../classes/education';
import {Elective} from '../classes/elective';
import {CriteriaCheckService} from '../services/criteria-check.service';
import {ElectiveCriterion} from '../classes/elective-criterion';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/combineLatest';

declare const Visualforce: any;

@Component({
  selector: 'iee-review-container',
  templateUrl: './review-container.component.html',
  styleUrls: ['./review-container.component.css']
})
export class ReviewContainerComponent implements OnInit {
  education: Education;
  readyToSubmit = false;
  primaryElectivesByProgramMajorIds: Map<string, Elective[]> = new Map<string, Elective[]>();
  alternateElectivesByProgramMajorIds: Map<string, Elective[]> = new Map<string, Elective[]>();
  availableElectivesByProgramMajorIds: Map<string, Elective[]> = new Map<string, Elective[]>();
  availableRequiredCriteriaByProgramMajorIds: Map<string, number> = new Map<string, number>();
  availableOptionalCriteriaByProgramMajorIds: Map<string, number> = new Map<string, number>();
  electiveCriteria: Map<string, ElectiveCriterion[]> = new Map<string, ElectiveCriterion[]>();
  submitting = false;

  constructor(private electiveDataService: ElectiveDataService, private criteriaCheckService: CriteriaCheckService) {
  }

  ngOnInit() {
    const electiveObs = this.electiveDataService.electiveCriteria.asObservable();
    const educationObs = this.electiveDataService.education.asObservable();

    Observable.combineLatest(electiveObs, educationObs).subscribe((o) => {
      [this.electiveCriteria, this.education] = o;

      this.education.programMajorIds.forEach(pmId => {
        if (this.education.electivesByProgramMajorIds[pmId]) {
          this.primaryElectivesByProgramMajorIds.set(pmId, this.education.electivesByProgramMajorIds[pmId].filter(e => {
            return e.isPrimary;
          }));
          this.alternateElectivesByProgramMajorIds.set(pmId, this.education.electivesByProgramMajorIds[pmId].filter(e => {
            return e.isAlternate;
          }));
          this.availableElectivesByProgramMajorIds.set(pmId, this.education.electivesByProgramMajorIds[pmId].filter(e => {
            return e.isPrimary || e.isAlternate || e.availableSlots > 0;
          }));
        } else {
          this.primaryElectivesByProgramMajorIds.set(pmId, []);
          this.alternateElectivesByProgramMajorIds.set(pmId, []);
        }

        if (this.electiveCriteria.get(pmId)) {
          const primaryElectives = this.primaryElectivesByProgramMajorIds.get(pmId);

          const typeCriteria = this.criteriaCheckService.initializeTypeCriteriaList(pmId, this.electiveCriteria);
          const criteriaMap = this.criteriaCheckService.buildTypeCriteriaMap(typeCriteria, this.education.sessionsByProgramMajorIds[pmId]);
          this.criteriaCheckService.checkCriteriaCheckMarks(typeCriteria, primaryElectives, criteriaMap);

          this.availableRequiredCriteriaByProgramMajorIds.set(pmId,
            this.criteriaCheckService.countAvailableCriteria(typeCriteria.filter(criteria => {
              return criteria.isRequired;
            }), false)
          );

          this.availableOptionalCriteriaByProgramMajorIds.set(pmId,
            this.criteriaCheckService.countAvailableCriteria(typeCriteria.filter(criteria => {
              return !criteria.isRequired;
            }), false)
          );
        }
      });
    });
  }

  onSubmit() {
    this.submitting = true;
    Visualforce.remoting.Manager.invokeAction(
      'IEE_ElectivePicker_Controller.saveElectiveComplete',
      this.education.educationId,
      (saved: boolean) => {
        // redirect on true
        window.location.href = 'IEE_ElectivesChosen?eid=' + this.education.educationId;
      },
      {buffer: false, escape: false}
    );
  }

  onClickCheckbox() {
    if (this.canClickCheckbox()) {
      this.readyToSubmit = this.readyToSubmit !== true;
    }
  }


  electivesUnavailable(pmId: string): boolean {
    return (!this.education.electivesByProgramMajorIds[pmId])
      || (this.education.electivesByProgramMajorIds[pmId].length === 0);
  }

  electiveSlotsAvailable(pmId: string): boolean {
    const electives = this.education.electivesByProgramMajorIds[pmId];
    if (electives) {
      return electives.reduce((open: boolean, elective) => {
        return open || elective.availableSlots > 0;
      }, false);
    }

    return true;
  }

  hasAlternatesButNoPrimariesForProgram(pmId: string): boolean {
    return this.primaryElectivesByProgramMajorIds.get(pmId).length === 0
      && this.alternateElectivesByProgramMajorIds.get(pmId).length > 0;
  }

  canClickCheckbox(): boolean {
    // iterate over map and check if any value is greater than zero.
    // If yes, the user can't submit
    const keys = Array.from(this.availableRequiredCriteriaByProgramMajorIds.keys());

    return keys.reduce((complete, key) => {
      return complete
        && (this.availableRequiredCriteriaByProgramMajorIds.get(key) === 0)
        && (this.hasAlternatesButNoPrimariesForProgram(key) === false);
    }, true);
  }
}
