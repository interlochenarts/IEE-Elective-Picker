import {Elective} from './elective';

export class Education {
  sessionsByProgramMajorIds: { [pm_id: string]: string } = {};
  programMajorIds: Array<string> = [];
  electivesByProgramMajorIds: { [pm_id: string]: Elective[] } = {};
  programNamesByProgramMajorIds: { [pm_id: string]: string } = {};
  longDescriptionsByProgramMajorIds: { [pm_id: string]: string } = {};
  educationId: string;
  division: string;
  totalWeeksAttending: number;
  privateLessonFormActive: boolean;
  privateLessonFormSubmitted: boolean;

  studentFirstName: string;
  studentLastName: string;
  currentUserEmail: string;

  public static createFromJson(json: string): Education {
    const ed = new Education();
    const j = JSON.parse(json);
    const ed2: Education = Object.assign(ed, j);

    for (const pmId in j.electivesByProgramMajorIds) {
      if (j.electivesByProgramMajorIds.hasOwnProperty(pmId)) {
        ed.electivesByProgramMajorIds[pmId] = j.electivesByProgramMajorIds[pmId].map((elective) => {
          // create actual elective objects to get properties that work
          return Elective.createFromJson(elective);
        });
        // sort the list of electives by time/period
        ed.electivesByProgramMajorIds[pmId].sort(
          (a: Elective, b: Elective) => {
            const aVal = a.startPeriod + a.courseDescription + a.section;
            const bVal = b.startPeriod + b.courseDescription + b.section;
            return aVal.localeCompare(bVal);
          }
        );
      }
    }

    return ed2;
  }
}
