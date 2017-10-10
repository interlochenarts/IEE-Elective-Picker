import {Component, Input, OnInit} from '@angular/core';
import {ElectiveCriterion} from '../classes/elective-criterion';
import {ElectiveDataService} from '../elective-data-service';
import {Elective} from '../classes/elective';

class TypeCount {
  type: string;
  count: number;
}

@Component({
  selector: 'iee-elective-criteria-container',
  templateUrl: './elective-criteria-container.component.html',
  styleUrls: ['./elective-criteria-container.component.less']
})
export class ElectiveCriteriaContainerComponent implements OnInit {
  @Input() activeProgramMajorId: string;
  criteriaComplete: boolean[] = [];
  electives: Elective[] = [];
  periodCriteria: ElectiveCriterion[] = [];
  typeCriteria: ElectiveCriterion[] = [];
  criteriaTypeCounts: TypeCount[] = [];

  static criterionIsMet(criterion: ElectiveCriterion, electives: Elective[]): boolean {
    // true if satisfied, false if not
    const typeList: string[] = criterion.electiveTypes.split(';');
    return electives.reduce((result, elective) => {
      return (typeList.indexOf(elective.electiveType) > -1) || (typeList[0] === 'Any Available') || result;
    }, false);
  }

  static buildCriteriaCounts(ec: ElectiveCriterion[]): TypeCount[] {
    const criteriaMap: Map<string, number> = new Map<string, number>();
    ec.forEach(criterion => {
      criterion.typeList.forEach(type => {
        const count = criteriaMap.get(type);
        if (!count) {
          criteriaMap.set(type, 1);
        } else {
          criteriaMap.set(type, count + 1);
        }
      });
    });
    const criteriaList: TypeCount[] = [];
    for (const c of Array.from(criteriaMap.entries())) {
      criteriaList.push({type: c[0], count: c[1]});
    }
    criteriaList.sort((a, b) => {
      return b.count - a.count;
    });

    console.log(criteriaList);
    return criteriaList;
  }

  constructor(private electiveDataService: ElectiveDataService) {
  }

  ngOnInit() {
    this.electiveDataService.electiveCriteria.asObservable().subscribe({
      next: data => {
        if (data) {
          this.typeCriteria = data[this.activeProgramMajorId].filter(criterion => {
            return criterion.requirementType === 'type';
          });
          for (let i = 0; i < this.typeCriteria.length; i++) {
            this.criteriaComplete[i] = false;
          }

          this.periodCriteria = data[this.activeProgramMajorId].filter(criterion => {
            return criterion.requirementType === 'period';
          });

          this.criteriaTypeCounts = ElectiveCriteriaContainerComponent.buildCriteriaCounts(this.typeCriteria);
        }
      }
    });

    this.electiveDataService.education.asObservable().subscribe({
      next: data => {
        this.electives = data.electivesByProgramMajorIds[this.activeProgramMajorId];
      }
    });
  }

  evaluateTypeCriteria(): void {
    this.typeCriteria.forEach((criterion, index, array) => {
      let evaluatedCriterionResult: boolean = ElectiveCriteriaContainerComponent.criterionIsMet(criterion, this.electives);
      /*
      For each criteria, evaluate to see if it's true first.
      Then try to evaluate to see if anything more specific or just as specific has already
      been evaluated as true.

      If it has, it needs to be marked false if the other one successfully satisfied it first.
      If this is a second requirement, and the first has been filled, this one is not.
      If this is a second requirement and this is the second time the requirement is filled
      this one is marked true.

      I need to check other criteria to see if they match this one.
      */

      this.criteriaComplete[index] = true;
    });
  }
}
