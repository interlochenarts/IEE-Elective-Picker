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
      if (criteriaGroup.periodNumbers.length === 0 || criteriaGroup.periodNumbers.includes(elective.startPeriod)) {
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

    criteriaGroups.sort((a, b) => {
      if (a.periodNumbers.length > 0 && b.periodNumbers.length > 0) {
        return a.periodNumbers[0] - b.periodNumbers[0];
      }

      return 0;
    });

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
        // concat.apply allows me to flatten a list of lists into a single list
        [].concat.apply([], Array.from(group.andCriteria.values()))
          .forEach(c => c.isSatisfied = false);
      }
    });

    // TODO: this probably fails with the new changes
    const electives: Elective[] = primaryElectives.slice(0);
    electives.sort((a, b) => criteriaMap.get(a.electiveType + a.session) - criteriaMap.get(b.electiveType + b.session));

    electives.forEach(elective => {
      for (let i = 0; i < typeCriteria.length; i++) {
        if (!typeCriteria[i].isSatisfied && CriteriaCheckService.criteriaGroupIsMet(typeCriteria[i], elective)) {
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
          let key = type + (criterion.courseSession ? criterion.courseSession : campSession);

          if (group.periodNumbers.length > 0) {
            key += '||' + group.periodNumbers.join(',');
          }

          const count = criteriaMap.get(key) || 0;
          criteriaMap.set(key, count + 1);
        });
      });
      group.andCriteria.forEach(ands => {
        ands.forEach(criterion => {
          criterion.typeList.forEach(type => {
            let key = type + (criterion.courseSession ? criterion.courseSession : campSession);

            if (group.periodNumbers.length > 0) {
              key += '||' + group.periodNumbers.join(',');
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
      const keyPeriod = c[0].split('||');
      let ps: number[] = [];
      if (keyPeriod[1]) {
        ps = keyPeriod[1].split(',').map(p => +p);
      }
      criteriaList.push(new TypeCount(keyPeriod[0], c[1], ps));
    }
    criteriaList.sort((a, b) => b.count - a.count);

    return criteriaList;
  }

  getElectiveTypeChosenCounts(primaryElectives: Elective[]): TypeCount[] {
    const electiveTypeCountMap: Map<string, TypeCount> = new Map<string, TypeCount>();
    primaryElectives.forEach(elective => {
      const periods = [elective.startPeriod];
      const type = elective.electiveType + elective.session;
      const key = type + '||' + elective.startPeriod;
      const tc = electiveTypeCountMap.get(key) || new TypeCount(type, 0, []);
      tc.count += 1;
      tc.periods.push.apply(tc.periods, periods);
      electiveTypeCountMap.set(key, tc);
    });

    return Array.from(electiveTypeCountMap.values()).sort((a, b) => b.count - a.count);
  }

  getCriteriaTypeSatisfiedCounts(electiveTypeCounts: TypeCount[],
                                 criteria: ElectiveCriterion[], campSession: string): TypeCount[] {
    // need a deep copy of criteria
    const criteriaCopy: ElectiveCriterion[] = JSON.parse(JSON.stringify(criteria)).map(j => ElectiveCriterion.createFromJson(j));

    // make sure all criteria are unsatisfied
    criteriaCopy.forEach(c => c.isSatisfied = false);

    // console.log('getCriteriaTypeSatisfiedCounts | criteriaCopy: ');
    // console.log(criteriaCopy);

    const typeCountMap: Map<string, TypeCount> = new Map<string, TypeCount>();
    // iterate across all the selected types
    electiveTypeCounts.forEach(type => {
      for (let i = 0; i < type.count; i++) {
        for (let k = 0; k < criteriaCopy.length; k++) {
          const c: ElectiveCriterion = criteriaCopy[k];
          const typesWithSessions: string[] = c.typeList.map(t => c.courseSession ? t + c.courseSession : t + campSession);

          if (c.isSatisfied === false
            && typesWithSessions.indexOf(type.type) > -1
            && (c.orGroupPeriodList.length === 0 || c.orGroupPeriodList.includes(type.periods[0]))) {
            c.isSatisfied = true;
            typesWithSessions.forEach(t => {
              const key = t + '||' + c.orGroupPeriodList.join(',');
              const count: TypeCount = typeCountMap.get(key) || new TypeCount(t, 0, []);
              count.count += 1;
              count.periods = count.periods.concat(c.orGroupPeriodList);
              typeCountMap.set(key, count);
            });
            break;
          }
        }
      }
    });

    const typeList: TypeCount[] = Array.from(typeCountMap.values());

    typeList.sort((a, b) => b.count - a.count);

    return typeList;
  }

  checkClosedTypes(possibleTypeCounts: TypeCount[], satisfiedTypeCounts: TypeCount[]): string[] {
    const closedTypeList: string[] = [];
    possibleTypeCounts.forEach(possibleType => {
      satisfiedTypeCounts.forEach(satisfiedType => {
        // check to see if I have any periods in the satisfied type that are also in the possible type
        const periodFilled: boolean = satisfiedType.periods.length === 0 ||
          satisfiedType.periods
            .filter(stp => possibleType.periods.includes(stp) || possibleType.periods.length === 0)
            .length > 0;
        if (possibleType.type === satisfiedType.type && possibleType.count === satisfiedType.count && periodFilled) {
          const val = satisfiedType.type + (possibleType.periods.length > 0 ? '||' + possibleType.periods.join(',') : '');
          closedTypeList.push(val);
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
      const group1: number[] = criterion.periodGroup1.split(';').map(n => +n);
      const group2: number[] = criterion.periodGroup2.split(';').map(n => +n);

      // remove values that are in both lists
      const a: number[] = group1.filter(period => !(group2.indexOf(period) > -1));
      const b: number[] = group2.filter(period => !(group1.indexOf(period) > -1));
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
