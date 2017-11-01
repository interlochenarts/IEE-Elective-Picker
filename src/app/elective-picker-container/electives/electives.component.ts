import {Component, Input, OnInit} from '@angular/core';
import {Elective} from '../../classes/elective';
import {ElectiveDataService} from '../../elective-data-service';

@Component({
  selector: 'iee-electives',
  templateUrl: './electives.component.html',
  styleUrls: ['./electives.component.css']
})
export class ElectivesComponent implements OnInit {
  @Input() electivesType: string;
  @Input() electives: Elective[];
  closedTypes: string[] = [];
  closedPeriods: number[] = [];
  private availableCriteriaCount: number;
  availableCriteriaBySession: Map<string, number>;

  get displayedElectives(): Elective[] {
    if (this.electives) {
      return this.electives.filter((elective: Elective) => {
        if (this.isPrimary) {
          return !elective.isAlternate;
        }
        if (this.isAlternate) {
          return !elective.isPrimary;
        }
        return true;
      });
    }

    return [];
  }

  get selectedPeriods(): string[] {
    const periods: string[] = [];
    if (this.electives) {
      this.electives.forEach((elective: Elective) => {
        if ((this.isPrimary && elective.isPrimary) || (this.isAlternate && elective.isAlternate)) {
          if (periods.indexOf(elective.startPeriod + '-' + elective.session) < 0) {
            periods.push(elective.startPeriod + '-' + elective.session);
          }
          // INFO: works as long as our classes are not more than 2 hours long
          if (periods.indexOf(elective.endPeriod + '-' + elective.session) < 0) {
            periods.push(elective.endPeriod + '-' + elective.session);
          }
        }
      });
    }

    return periods;
  }

  get isPrimary() {
    return this.electivesType.toLowerCase() === 'primary';
  }

  get isAlternate() {
    return this.electivesType.toLowerCase() === 'alternate';
  }

  static courseIsFull(elective: Elective): boolean {
    return elective.availableSlots <= 0;
  }

  constructor(private electiveDataService: ElectiveDataService) {
  }

  ngOnInit() {
    this.electiveDataService.closedTypes.asObservable().subscribe({
      next: closed => {
        this.closedTypes = closed;
      }
    });
    this.electiveDataService.availableCriteria.asObservable().subscribe({
      next: available => {
        this.availableCriteriaCount = available;
      }
    });
    this.electiveDataService.closedPeriods.asObservable().subscribe({
      next: closed => {
        this.closedPeriods = closed;
      }
    });
    this.electiveDataService.availableCriteriaBySession.asObservable().subscribe({
      next: availableMap => {
        this.availableCriteriaBySession = availableMap;
      }
    });
  }

  private periodFilled(period: number, primary: boolean, session: string): boolean {
    const key = period + '-' + session;
    if (primary === true) {
      return (this.closedPeriods.indexOf(period) > -1 || this.selectedPeriods.indexOf(key) > -1);
    }
    return this.selectedPeriods.indexOf(key) > -1;
  }

  private typeClosed(electiveType: string): boolean {
    return this.closedTypes.indexOf(electiveType) > -1;
  }

  private electiveCriteriaFilled(): boolean {
    return this.availableCriteriaCount === 0;
  }

  private electiveCriteriaForSessionFilled(session: string): boolean {
    if (this.availableCriteriaBySession) {
      // if the value exists, there are criteria left. Otherwise it's filled.
      return !(this.availableCriteriaBySession.get(session));
    }

    return false;
  }

  private coRequisiteDisabled(elective: Elective): boolean {
    const coReq: Elective = this.getCoRequisite(elective);
    if (coReq) {
      return this.isDisabled(coReq, false);
    } else {
      return false;
    }
  }

  getCoRequisite(elective: Elective): Elective {
    if (elective.electiveCorequisiteId && this.electives) {
      for (let i = 0; i < this.electives.length; i++) {
        if (this.electives[i].id === elective.electiveCorequisiteId) {
          return this.electives[i];
        }
      }
    }

    return null;
  }

  isCourseSelectedAtDifferentTime(elective: Elective): boolean {
    for (let i = 0; i < this.electives.length; i++) {
      if (elective.courseNumber === this.electives[i].courseNumber &&
        this.electives[i].isPrimary &&
        elective.session === this.electives[i].session) {

        return true;
      }
    }

    return false;
  }

  isDisabled(elective: Elective, checkCoReq: boolean) {
    const disabled = this.periodFilled(elective.startPeriod, this.isPrimary, elective.session) ||
      this.periodFilled(elective.endPeriod, this.isPrimary, elective.session) ||
      this.isCourseSelectedAtDifferentTime(elective) ||
      ElectivesComponent.courseIsFull(elective) ||
      (this.isPrimary && (
          (this.typeClosed(elective.electiveType) ||
            this.electiveCriteriaForSessionFilled(elective.session) ||
            this.electiveCriteriaFilled())
        )
      );

    // prevent an infinite loop
    if (checkCoReq) {
      return disabled || this.coRequisiteDisabled(elective);
    } else {
      return disabled;
    }
  }
}
