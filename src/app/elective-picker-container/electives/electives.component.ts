import {Component, DoCheck, Input, OnInit} from '@angular/core';
import {Elective} from '../../classes/elective';
import {ElectiveDataService} from '../../services/elective-data-service';
import {animateChild, query, transition, trigger} from '@angular/animations';
import {FilterListItem} from "../../classes/filter-list-item";

@Component({
  selector: 'iee-electives',
  templateUrl: './electives.component.html',
  styleUrls: ['./electives.component.css'],
  animations: [
    trigger('shrinkOut', [
      transition(':leave', [
        query('@shrinkGrow', animateChild())
      ])
    ]),
  ]
})
export class ElectivesComponent implements OnInit, DoCheck {
  @Input() electivesType: string;
  @Input() electives: Elective[];
  closedTypes: string[] = [];
  closedPeriods: number[] = [];
  private availableCriteriaCount: number;
  availableCriteriaBySession: Map<string, number>;
  private typeFilters: FilterListItem[] = [];
  private filteredTypes: string[] = [];
  private _selectedTypeCount = 0;

  get displayedElectives(): Elective[] {
    if (this.electives) {
      return this.electives.filter((elective: Elective) => {
        if (this.isPrimary) {
          return !elective.isAlternate && elective.availableSlots > 0
            && (this.filteredTypes.length === 0 || this.filteredTypes.indexOf(elective.electiveType) >= 0);
        }
        if (this.isAlternate) {
          return !elective.isPrimary && elective.availableSlots > 0
            && (this.filteredTypes.length === 0 || this.filteredTypes.indexOf(elective.electiveType) >= 0);
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
          Array.from({length: elective.endPeriod - elective.startPeriod + 1}).forEach((n, index) => {
            const period = elective.startPeriod + index;
            if (periods.indexOf(period + '-' + elective.session) < 0) {
              periods.push(period + '-' + elective.session);
            }
          });
        }
      });
    }

    return periods;
  }

  get isPrimary(): boolean {
    return this.electivesType.toLowerCase() === 'primary';
  }

  get isAlternate(): boolean {
    return this.electivesType.toLowerCase() === 'alternate';
  }

  static courseIsFull(elective: Elective): boolean {
    return elective.availableSlots <= 0;
  }

  constructor(private electiveDataService: ElectiveDataService) {
  }

  ngDoCheck() {
    const selectedTypeCount: number = this.typeFilters.reduce((count, item) => {
      return count + (item.isSelected ? 1 : 0);
    }, 0);
    if (selectedTypeCount !== this._selectedTypeCount) {
      this.filteredTypes = [];
      this.typeFilters.forEach(f => {
        if (f.isSelected) {
          this.filteredTypes.push(f.description);
        }
      });
      this._selectedTypeCount = selectedTypeCount;
    }
  }

  ngOnInit() {
    this.electiveDataService.typeFilterList.asObservable().subscribe({
      next: filters => this.typeFilters = filters
    });
    this.electiveDataService.closedTypes.asObservable().subscribe({
      next: closed => this.closedTypes = closed
    });
    this.electiveDataService.availableCriteria.asObservable().subscribe({
      next: available => this.availableCriteriaCount = available
    });
    this.electiveDataService.closedPeriods.asObservable().subscribe({
      next: closed => this.closedPeriods = closed
    });
    this.electiveDataService.availableCriteriaBySession.asObservable().subscribe({
      next: availableMap => this.availableCriteriaBySession = availableMap
    });
  }

  private periodFilled(period: number, primary: boolean, session: string): boolean {
    const key = period + '-' + session;
    if (primary === true) {
      return (this.closedPeriods.indexOf(period) > -1 || this.selectedPeriods.indexOf(key) > -1);
    }
    return this.selectedPeriods.indexOf(key) > -1;
  }

  private typeClosed(electiveType: string, electiveSession: string, electivePeriod: number): boolean {
    const val = electiveType + electiveSession;
    return this.closedTypes.reduce((closed, type) => {
      if (type.includes('||')) {
        const halves = type.split('||');
        return closed || (halves[1].includes(electivePeriod + '') && halves[0].includes(val));
      }
      return closed;
    }, false);
  }

  private electiveCriteriaFilled(): boolean {
    return this.availableCriteriaCount === 0;
  }

  private electiveCriteriaForSessionFilled(session: string): boolean {
    if (this.availableCriteriaBySession && this.availableCriteriaBySession.size > 0) {
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

  isDisabled(elective: Elective, checkCoReq: boolean): boolean {
    const disabled = this.periodFilled(elective.startPeriod, this.isPrimary, elective.session) ||
      this.periodFilled(elective.endPeriod, this.isPrimary, elective.session) ||
      this.isCourseSelectedAtDifferentTime(elective) ||
      (this.isPrimary && (
          (this.typeClosed(elective.electiveType, elective.session, elective.startPeriod) ||
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

  isDisplayed(elective: Elective, checkCoReq: boolean): boolean {
    const displayed = ElectivesComponent.courseIsFull(elective) === false;

    // assuming we remove if other half is full
    if (checkCoReq) {
      return displayed && this.isCoReqDisplayed(elective);
    } else {
      return displayed;
    }
  }

  private isCoReqDisplayed(elective: Elective): boolean {
    const coReq: Elective = this.getCoRequisite(elective);

    if (coReq) {
      return this.isDisplayed(coReq, false);
    } else {
      return true; // a bit of a mis-representation. If there's no co-req, just pretend it's visible.
    }
  }
}
