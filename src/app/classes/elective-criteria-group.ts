import {ElectiveCriterion} from './elective-criterion';

export class ElectiveCriteriaGroup {
  orGroupName: string;
  orCriteria: ElectiveCriterion[];
  andCriteria: Map<string, ElectiveCriterion[]>;
  isSatisfied = false;
  courseSession: string;
  isRequired: boolean;

  constructor(groupName: string) {
    this.orCriteria = new Array<ElectiveCriterion>();
    this.andCriteria = new Map<string, ElectiveCriterion[]>();
    this.orGroupName = groupName;
  }

  get description(): string {
    let desc = '';
    this.orCriteria.forEach((c, index, array) => {
      desc += c.description;
      if ((index < array.length - 1) || this.andCriteria.size > 0) {
        desc += '<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&mdash; OR &mdash;<br />';
      }
    });

    let count = 0;
    this.andCriteria.forEach((andList: ElectiveCriterion[]) => {
      count += 1;
      andList.forEach((c, index, array) => {
        desc += c.description;
        if (index < array.length - 1) {
          desc += ' AND ';
        }
      });
      if (count < this.andCriteria.size) {
        desc += '<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&mdash; OR &mdash;<br />';
      }
    });

    return desc;
  }
}
