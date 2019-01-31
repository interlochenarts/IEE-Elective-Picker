import {Injectable} from '@angular/core';
import {ElectiveCriterion} from '../classes/elective-criterion';
import {Elective} from '../classes/elective';
import {TypeCount} from '../classes/type-count';
import {ElectiveDataService} from './elective-data-service';

@Injectable()
export class CriteriaCheckService {
  private static criterionIsMet(criterion: ElectiveCriterion, elective: Elective): boolean {
    // true if satisfied, false if not
    if (criterion.courseSession) {
      return criterion.typeList.indexOf(elective.electiveType) > -1
        && criterion.courseSession === elective.session;
    }
    return criterion.typeList.indexOf(elective.electiveType) > -1;
  }

  initializeTypeCriteriaList(pmId: string,
                             electiveCriteria: Map<string, ElectiveCriterion[]>): Map<string, Map<string, ElectiveCriterion[]>> {
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
      const orMap = criteriaMap.get(c.orGroup) || new Map<string, ElectiveCriterion[]>();
      const andList = orMap.get(c.andGroup) || new Array<ElectiveCriterion>();

      andList.push(c);
      orMap.set(c.andGroup, andList);

      criteriaMap.set(c.orGroup, orMap);
    });

    return criteriaMap;
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

  public checkCriteriaCheckMarks(typeCriteria: ElectiveCriterion[],
                                 primaryElectives: Elective[], criteriaMap: Map<string, number>) {
    // unset all check marks
    for (let i = 0; i < typeCriteria.length; i++) {
      typeCriteria[i].isSatisfied = false;
    }

    const electives = primaryElectives.slice(0);
    electives.sort((a, b) => {
      return criteriaMap.get(a.electiveType) - criteriaMap.get(b.electiveType);
    });

    electives.forEach(elective => {
      for (let i = 0; i < typeCriteria.length; i++) {
        if (typeCriteria[i].isSatisfied) {
          continue;
        }

        if (CriteriaCheckService.criterionIsMet(typeCriteria[i], elective)) {
          typeCriteria[i].isSatisfied = true;
          break;
        }
      }
    });
  }

  buildTypeCriteriaMap(ecs: Map<string, Map<string, ElectiveCriterion[]>>, campSession: string): Map<string, number> {
    const criteriaMap: Map<string, number> = new Map<string, number>();
    ecs.forEach((orMap: Map<string, ElectiveCriterion[]>, orGroupName: string) => {
      orMap.forEach((andList: ElectiveCriterion[], andGroupName: string) => {
        andList.forEach(criterion => {
          criterion.typeList.forEach(type => {
            let key = type;
            if (criterion.courseSession) {
              key += criterion.courseSession;
            } else {
              key += campSession;
            }

            if (orGroupName && !andGroupName) {
              key += orGroupName;
            } else if (orGroupName && andGroupName) {
              key += orGroupName + andGroupName;
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
                                 criteria: Map<string, Map<string, ElectiveCriterion[]>>, campSession: string): TypeCount[] {
    // need a deep copy of criteria
    const criteriaCopy: Map<string, Map<string, ElectiveCriterion[]>> = JSON.parse(JSON.stringify(criteria));

    const criteriaList: ElectiveCriterion[] = [];
    // make sure all criteria are unsatisfied
    criteriaCopy.forEach(or => {
      or.forEach(and => {
        and.forEach(criterion => {
          criterion.isSatisfied = false;
          criteriaList.push(criterion);
        });
      });
    });

    // console.log('getCriteriaTypeSatisfiedCounts | criteriaCopy: ');
    // console.log(criteriaCopy);

    const typeCountMap: Map<string, number> = new Map<string, number>();
    // iterate across all the selected types
    electiveTypeCounts.forEach(type => {
      for (let i = 0; i < type.count; i++) {
        for (let j = 0; j < criteriaList.length; j++) {
          const c = criteriaList[j];
          const typesWithSessions = c.typeList.map(t => {
            let ts = t;
            if (c.courseSession) {
              ts += c.courseSession;
            } else {
              ts += campSession;
            }

            if (c.orGroup && !c.andGroup) {
              ts += c.orGroup;
            } else if (c.orGroup && c.andGroup) {
              ts += c.orGroup + c.andGroup;
            }

            return ts;
          });
          // console.log('getCriteriaTypeSatisfiedCounts | criteriaCopy[' + j + ']: ');
          // console.log(criteriaCopy[j]);

          // console.log('getCriteriaTypeSatisfiedCounts | typesWithSessions (' + j + ')');
          // console.log(typesWithSessions);

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
    const closedTypeList: string[] = [];
    criteriaTypeCounts.forEach(criteriaType => {
      criteriaSatisfiedTypeCounts.forEach(satisfiedType => {
        if (criteriaType.type === satisfiedType.type && criteriaType.count === satisfiedType.count) {
          // TODO: make sure this actually works
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
  countAvailableCriteria(typeCriteria: ElectiveCriterion[], broadcast: boolean): number {
    const available = typeCriteria.reduce((count, criterion) => {
      return count - (criterion.isSatisfied ? 1 : 0);
    }, typeCriteria.length);

    const availMapBySession = new Map<string, number>();
    typeCriteria.forEach(criterion => {
      if (criterion.courseSession && !criterion.isSatisfied) {
        const a = availMapBySession.get(criterion.courseSession) || 0;
        availMapBySession.set(criterion.courseSession, a + 1);
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
