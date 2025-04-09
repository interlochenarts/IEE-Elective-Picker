declare const Visualforce: any;

export class Elective {
  id: string;
  courseNumber: string;
  electiveType: string;
  electiveCorequisiteId: string;
  section: string;
  session: string;
  sessionId: string;
  startPeriod: number;
  endPeriod: number;
  programMajorId: string;
  courseRequestId: string;
  isUpdating = false;
  courseDetail: string;

  enrolledCount: number;
  maxEnrollment: number;

  private _courseDescription = '';
  private _isPrimary = false;
  private _isAlternate = false;
  private _isDeleting = false;

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

  public static createFromJson(json: any): Elective {
    const elective = new Elective();
    return Object.assign(elective, json);
  }

  get courseDescription(): string {
    return this._courseDescription.substring(this._courseDescription.indexOf(' ')).trim();
  }

  set courseDescription(value: string) {
    this._courseDescription = value;
  }

  get time(): string {
    return this.timePeriodMap[this.startPeriod];
  }

  get startTime(): string {
    return this.timePeriodMap[this.startPeriod];
  }

  get endTime(): string {
    return this.timePeriodMap[this.endPeriod + 1];
  }

  get isPrimary(): boolean {
    return this._isPrimary;
  }

  set isPrimary(status: boolean) {
    this._isPrimary = status;
  }

  get isAlternate(): boolean {
    return this._isAlternate;
  }

  set isAlternate(status: boolean) {
    this._isAlternate = status;
  }

  get isDeleting(): boolean {
    return this._isDeleting;
  }

  set isDeleting(deleting: boolean) {
    this._isDeleting = deleting;
  }

  get availableSlots(): number {
    const avail = this.maxEnrollment - this.enrolledCount;
    return (avail < 0 ? 0 : avail);
  }

  public deleteFromSalesforce(): Promise<any> {
    this.isDeleting = true;
    this.enrolledCount -= 1;
    return new Promise((resolve, reject) => {
      Visualforce.remoting.Manager.invokeAction(
        'IEE_ElectivePicker_Controller.deleteElectiveChoiceCamp',
        this.courseRequestId, this.id,
        (saved: boolean) => {
          this.isDeleting = false;
          this.courseRequestId = null;
          resolve(saved);
        },
        {buffer: false, escape: false}
      );
    });
  }

  public insertIntoSalesforce(educationId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      Visualforce.remoting.Manager.invokeAction(
        'IEE_ElectivePicker_Controller.insertElectiveChoiceCamp',
        educationId,
        this.id,
        (this.isPrimary ? true : false), // is this the primary choice or alternate
        this.session,
        this.sessionId,
        (savedId: string) => {
          this.courseRequestId = savedId;
          // console.log(this.courseDescription + ' should have a courseRequestId of ' + savedId);
          resolve(savedId);
        },
        {buffer: false, escape: false}
      );
    });
  }
}
