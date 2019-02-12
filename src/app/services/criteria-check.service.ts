import {Injectable} from '@angular/core';
import {ElectiveCriterion} from '../classes/elective-criterion';
import {Elective} from '../classes/elective';
import {TypeCount} from '../classes/type-count';
import {ElectiveDataService} from './elective-data-service';
import {ElectiveCriteriaGroup} from '../classes/elective-criteria-group';

@Injectable()
export class CriteriaCheckService {
  private static criterionIsMet(criterion: ElectiveCriterion, elective: Elective): boolean {
    // console.log('criterionIsMet | [criterion, elective]:');
    // console.log([criterion, elective]);

    // true if satisfied, false if not
    if (criterion.courseSession) {
      return criterion.typeList.indexOf(elective.electiveType) > -1
        && criterion.courseSession === elective.session;
    }
    return criterion.typeList.indexOf(elective.electiveType) > -1;
  }

  private static criteriaGroupIsMet(criteriaGroup: ElectiveCriteriaGroup, elective: Elective): boolean {
    if (criteriaGroup.isSatisfied) {
      return true;
    } else {
      if (criteriaGroup.periodNumbers.includes(elective.startPeriod)) {
        // check the or group elective criteria
        for (let i = 0; i < criteriaGroup.orCriteria.length; i++) {
          const satisfied = CriteriaCheckService.criterionIsMet(criteriaGroup.orCriteria[i], elective);
          if (satisfied) {
            criteriaGroup.orCriteria[i].isSatisfied = true;
            criteriaGroup.isSatisfied = true;
            return true;
          }
        }

        // check the and group elective criteria
        for (const andGroup of Array.from(criteriaGroup.andCriteria.keys())) {
          // console.log('criteriaGroupIsMet | andGroup');
          // console.log(andGroup);
          const criteria: ElectiveCriterion[] = criteriaGroup.andCriteria.get(andGroup);

          const groupSatisfied = criteria.reduce((result: boolean, criterion: ElectiveCriterion) => {
            // side effect
            criterion.isSatisfied = criterion.isSatisfied || CriteriaCheckService.criterionIsMet(criterion, elective);
            return result && criterion.isSatisfied;
          }, true);

          if (groupSatisfied) {
            criteriaGroup.isSatisfied = true;
            return true;
          }
        }
      }
    }

    return false;
  }

  initializeTypeCriteriaList(pmId: string,
                             electiveCriteria: Map<string, ElectiveCriterion[]>): ElectiveCriteriaGroup[] {

    // console.log('initializeTypeCriteriaList | electiveCriteria');
    // console.log(electiveCriteria);

    let typeCriteria = [];
    const criteriaByPMId = electiveCriteria.get(pmId);
    if (criteriaByPMId) {
      typeCriteria = criteriaByPMId.filter(criterion => {
        return criterion.requirementType === 'type';
      });
      for (let i = 0; i < typeCriteria.length; i++) {
        typeCriteria[i].isSatisfied = false;
      }
    }

    const criteriaMap = new Map<string, Map<string, ElectiveCriterion[]>>();
    typeCriteria.forEach((c: ElectiveCriterion) => {
      const key = c.orGroup + (c.courseSession ? '___' + c.courseSession : '');
      const orMap = criteriaMap.get(key) || new Map<string, ElectiveCriterion[]>();
      const andList = orMap.get(c.andGroup) || new Array<ElectiveCriterion>();

      andList.push(c);
      orMap.set(c.andGroup, andList);

      criteriaMap.set(key, orMap);
    });

    // console.log('initializeTypeCriteriaList | criteriaMap: ');
    // console.log(criteriaMap);

    const criteriaGroups = new Array<ElectiveCriteriaGroup>();
    criteriaMap.forEach((orGroup: Map<string, ElectiveCriterion[]>, orGroupName: string) => {
      let group: ElectiveCriteriaGroup;
      if (orGroupName && orGroupName !== 'null') {
        const groupSession = orGroupName.split('___');
        group = new ElectiveCriteriaGroup(groupSession[0]);
        group.courseSession = groupSession[1] ? groupSession[1] : null;

        orGroup.forEach((andList: ElectiveCriterion[], andGroupName: string) => {
          if (andGroupName && andGroupName !== 'null') {
            const groupAnds = group.andCriteria.get(andGroupName) || new Array<ElectiveCriterion>();
            andList.forEach((c: ElectiveCriterion) => {
              groupAnds.push(c);
              group.isRequired = group.isRequired || c.isRequired;
              group.andCriteria.set(andGroupName, groupAnds);
            });
          } else {
            group.orCriteria = group.orCriteria.concat(andList);
          }
        });
        criteriaGroups.push(group);
      } else {
        // no or group name, so we want a new one for each criterion
        orGroup.forEach((andList: ElectiveCriterion[]) => {
          andList.forEach((c: ElectiveCriterion) => {
            group = new ElectiveCriteriaGroup(null);
            group.courseSession = c.courseSession;
            group.isRequired = group.isRequired || c.isRequired;
            group.orCriteria.push(c);
            criteriaGroups.push(group);
          });
        });
      }
    });

    // console.log('initializeTypeCriteriaList | criteriaGroups: ');
    // console.log(criteriaGroups);

    return criteriaGroups;
  }

  initializePeriodCriteriaList(pmId: string, electiveCriteria: Map<string, ElectiveCriterion[]>): ElectiveCriterion[] {
    let periodCriteria = [];
    const criteriaByPMId = electiveCriteria.get(pmId);
    if (criteriaByPMId) {
      periodCriteria = criteriaByPMId.filter(criterion => {
        return criterion.requirementType === 'period';
      });
      for (let i = 0; i < periodCriteria.length; i++) {
        periodCriteria[i].isSatisfied = false;
      }
    }

    return periodCriteria;
  }

  public checkCriteriaCheckMarks(typeCriteria: ElectiveCriteriaGroup[],
                                 primaryElectives: Elective[],
                                 criteriaMap: Map<string, number>): void {
    // unset all check marks
    typeCriteria.forEach(group => {
      group.isSatisfied = false;
      group.orCriteria.forEach(c => c.isSatisfied = false);
      if (group.andCriteria.size > 0) {
        [].concat.apply([], Array.from(group.andCriteria.values())).forEach(c => c.isSatisfied = false);
      }
    });

    // TODO: this probably fails with the new changes
    const electives = primaryElectives.slice(0);
    electives.sort((a, b) => {
      return criteriaMap.get(a.electiveType) - criteriaMap.get(b.electiveType);
    });

    electives.forEach(elective => {
      for (let i = 0; i < typeCriteria.length; i++) {
        if (typeCriteria[i].isSatisfied) {
          continue;
        }

        if (CriteriaCheckService.criteriaGroupIsMet(typeCriteria[i], elective)) {
          typeCriteria[i].isSatisfied = true;
          break;
        }
      }
    });

    // console.log('checkCriteriaCheckMarks | typeCriteria: ');
    // console.log(typeCriteria);
  }

  buildTypeCriteriaMap(ecs: ElectiveCriteriaGroup[], campSession: string): Map<string, number> {
    const criteriaMap: Map<string, number> = new Map<string, number>();
    ecs.forEach((group: ElectiveCriteriaGroup) => {
      group.orCriteria.forEach(criterion => {
        criterion.typeList.forEach(type => {
          let key = type;
          if (criterion.courseSession) {
            key += criterion.courseSession;
          } else {
            key += campSession;
          }

          const count = criteriaMap.get(key) || 0;
          criteriaMap.set(key, count + 1);
        });
      });
      group.andCriteria.forEach(ands => {
        ands.forEach(criterion => {
          criterion.typeList.forEach(type => {
            let key = type;
            if (criterion.courseSession) {
              key += criterion.courseSession;
            } else {
              key += campSession;
            }

            const count = criteriaMap.get(key) || 0;
            criteriaMap.set(key, count + 1);
          });
        });
      });
    });

    // console.log('buildTypeCriteriaMap | criteriaMap: ');
    // console.log(criteriaMap);

    return criteriaMap;
  }

  buildCriteriaCounts(criteriaMap: Map<string, number>): TypeCount[] {
    const criteriaList: TypeCount[] = [];
    for (const c of Array.from(criteriaMap.entries())) {
      criteriaList.push(new TypeCount(c[0], c[1]));
    }
    criteriaList.sort((a, b) => {
      return b.count - a.count;
    });

    return criteriaList;
  }

  getElectiveTypeChosenCounts(primaryElectives: Elective[]): TypeCount[] {
    const electiveTypeCountMap: Map<string, number> = new Map<string, number>();
    primaryElectives.forEach(elective => {
      const key = elective.electiveType + elective.session;
      const count = electiveTypeCountMap.get(key);
      if (!count) {
        electiveTypeCountMap.set(key, 1);
      } else {
        electiveTypeCountMap.set(key, count + 1);
      }
    });

    const typeList: TypeCount[] = [];
    for (const c of Array.from(electiveTypeCountMap.entries())) {
      const tc: TypeCount = new TypeCount(c[0], c[1]);
      typeList.push(tc);
    }

    typeList.sort((a, b) => {
      return b.count - a.count;
    });

    // console.log('getElectiveTypeChosenCounts | typeList: ');
    // console.log(typeList);

    return typeList;
  }

  getCriteriaTypeSatisfiedCounts(electiveTypeCounts: TypeCount[],
                                 criteria: ElectiveCriterion[], campSession: string): TypeCount[] {
    // need a deep copy of criteria
    const criteriaCopy: ElectiveCriterion[] = JSON.parse(JSON.stringify(criteria));

    // make sure all criteria are unsatisfied
    criteriaCopy.forEach(c => {
      c.isSatisfied = false;
    });

    // console.log('getCriteriaTypeSatisfiedCounts | criteriaCopy: ');
    // console.log(criteriaCopy);

    const typeCountMap: Map<string, number> = new Map<string, number>();
    // iterate across all the selected types
    electiveTypeCounts.forEach(type => {
      for (let i = 0; i < type.count; i++) {
        for (let k = 0; k < criteriaCopy.length; k++) {
          const c: ElectiveCriterion = criteriaCopy[k];
          const typesWithSessions: string[] = c.typeList.map(t => {
            if (c.courseSession) {
              return t + c.courseSession;
            } else {
              return t + campSession;
            }
          });

          if (c.isSatisfied === false && typesWithSessions.indexOf(type.type) > -1) {
            c.isSatisfied = true;
            typesWithSessions.forEach(t => {
              const count = typeCountMap.get(t) || 0;
              typeCountMap.set(t, count + 1);
            });
            break;
          }
        }
      }
    });

    const typeList: TypeCount[] = [];
    for (const c of Array.from(typeCountMap.entries())) {
      const tc: TypeCount = new TypeCount(c[0], c[1]);
      typeList.push(tc);
    }

    typeList.sort((a, b) => {
      return b.count - a.count;
    });

    // console.log('getCriteriaTypeSatisfiedCounts | typeList: ');
    // console.log(typeList);

    return typeList;
  }

  checkClosedTypes(criteriaTypeCounts: TypeCount[], criteriaSatisfiedTypeCounts: TypeCount[]): string[] {
    // console.log('checkClosedTypes | criteriaTypeCounts: ');
    // console.log(criteriaTypeCounts);
    // console.log('checkClosedTypes | criteriaSatisfiedTypeCounts: ');
    // console.log(criteriaSatisfiedTypeCounts);

    const closedTypeList: string[] = [];
    criteriaTypeCounts.forEach(criteriaType => {
      criteriaSatisfiedTypeCounts.forEach(satisfiedType => {
        if (criteriaType.type === satisfiedType.type && criteriaType.count === satisfiedType.count) {
          closedTypeList.push(satisfiedType.type);
        }
      });
    });

    return closedTypeList;
  }

  checkClosedPeriods(periodCriteria: ElectiveCriterion[], primaryElectives: Elective[]): number[] {
    let periodList: number[] = [];
    // reset all checkbox booleans
    periodCriteria.forEach(c => {
      c.pg2Satisfied = false;
      c.pg1Satisfied = false;
    });
    periodCriteria.forEach(criterion => {
      const group1: number[] = criterion.periodGroup1.split(';').map(n => {
        return +n;
      });
      const group2: number[] = criterion.periodGroup2.split(';').map(n => {
        return +n;
      });

      // remove values that are in both lists
      const a: number[] = group1.filter(period => {
        return !(group2.indexOf(period) > -1);
      });
      const b: number[] = group2.filter(period => {
        return !(group1.indexOf(period) > -1);
      });
      primaryElectives.forEach(elective => {
        if (a.indexOf(elective.startPeriod) > -1) {
          periodList = periodList.concat(b);
          criterion.pg1Satisfied = true;
        } else if (b.indexOf(elective.startPeriod) > -1) {
          periodList = periodList.concat(a);
          criterion.pg2Satisfied = true;
        }
      });
    });
    return periodList;
  }

  // counts the criteria which haven't been satisfied yet
  countAvailableCriteria(criteriaGroups: ElectiveCriteriaGroup[], broadcast: boolean): number {
    const available = criteriaGroups.reduce((count, criterion) => {
      return count - (criterion.isSatisfied ? 1 : 0);
    }, criteriaGroups.length);

    const availMapBySession = new Map<string, number>();
    criteriaGroups.forEach(group => {
      if (group.courseSession && !group.isSatisfied) {
        const a = availMapBySession.get(group.courseSession) || 0;
        availMapBySession.set(group.courseSession, a + 1);
      }
    });

    if (broadcast) {
      this.electiveDataService.availableCriteria.next(available);
      this.electiveDataService.availableCriteriaBySession.next(availMapBySession);
    }

    return available;
  }

  constructor(private electiveDataService: ElectiveDataService) {
  }

}
