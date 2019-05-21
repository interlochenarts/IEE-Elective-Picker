import {Component, Input, OnInit} from '@angular/core';
import {Elective} from '../../classes/elective';
import {animate, animateChild, query, state, style, transition, trigger} from '@angular/animations';

@Component({
  selector: 'iee-electives-selected',
  templateUrl: './electives-selected.component.html',
  styleUrls: ['./electives-selected.component.css'],
  animations: [
    trigger('shrink', [
      transition(':leave', [
        query('@shrinkGrow', animateChild())
      ])
    ])
  ]
})
export class ElectivesSelectedComponent implements OnInit {
  @Input() electives: Elective[];

  get primaries(): Elective[] {
    return this.electives.filter((elective) => {
      return elective.isPrimary;
    });
  }

  get alternates(): Elective[] {
    return this.electives.filter((elective) => {
      return elective.isAlternate;
    });
  }

  getCoRequisite(elective: Elective): Elective {
    if (elective.electiveCorequisiteId && this.electives) {
      for (let i = 0; i < this.electives.length; i++) {
        // console.log('getCoReqElective() eId: ' + this.electives[i].id + ' / coreqId: ' + this.elective.electiveCorequisiteId);
        if (this.electives[i].id === elective.electiveCorequisiteId) {
          // console.log('found co-req');
          return this.electives[i];
        }
      }
    }

    return null;
  }

  constructor() { }

  ngOnInit() {
  }

}
