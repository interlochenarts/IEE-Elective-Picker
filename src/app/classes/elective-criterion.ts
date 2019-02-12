export class ElectiveCriterion {
  isRequired: boolean;
  requirementType: string;
  electiveTypes: string;
  courseSession: string;
  criterionDescription: string;
  criterionName: string;
  periodGroup1: string;
  periodGroup2: string;
  programMajorId: string;
  isSatisfied: boolean;
  pg1Satisfied: boolean;
  pg2Satisfied: boolean;
  typeList: string[];
  orGroup: string;
  andGroup: string;
  orGroupPeriods: string;

  // TODO: should be global somehow
  private timePeriodMap = {
    1: '8:00am',
    2: '9:00am',
    3: '10:00am',
    4: '11:00am',
    5: '12:00pm',
    6: '1:00pm',
    7: '2:00pm',
    8: '3:00pm',
    9: '4:00pm',
    10: '5:00pm'
  };

  public static createFromJson(json): ElectiveCriterion {
    const ec = new ElectiveCriterion();
    return Object.assign(ec, json);
  }

  get description(): string {
    let description: string;
    if (this.criterionDescription) {
      description = this.criterionDescription;
    } else if (this.requirementType === 'period') {
      console.log('ERROR: Use group1description and group2description properties instead of description property');
      description = '';
    } else if (this.requirementType === 'type') {
      // elective type based description
      const typesArray = this.electiveTypes.split(';');
      const lastType = typesArray.pop();

      const firstTypes = typesArray.length > 0
        ? (typesArray.length > 1
          ? typesArray.reduce((printable, elType) => {
            return printable + elType + ', ';
          }, '')
          : typesArray[0])
        : ''; // oxford commas... sorry, future person, for nesting ternaries

      const typeString =
        firstTypes
        + (typesArray.length > 0 ? ' or ' : '') // print 'or' before the last item if more than one thing
        + lastType + ' ';
      description = 'One '
        + (this.electiveTypes === 'Any Arts Area' ? '' : typeString)
        + 'elective' +
        (this.courseSession
          ? ' during the ' + this.courseSession
          : '');
    }

    return description + (this.isRequired ? '' : ' (Optional)');
  }

  get group1description(): string {
    return this.getPeriodTimes(this.periodGroup1).join(', ');
  }

  get group2description(): string {
    return this.getPeriodTimes(this.periodGroup2).join(', ');
  }

  getPeriodTimes(periods: string): string[] {
    const periodArray: string[] = periods.split(';');
    return periodArray.map(period => {
      return this.timePeriodMap[parseInt(period, 10)];
    });
  }
}
