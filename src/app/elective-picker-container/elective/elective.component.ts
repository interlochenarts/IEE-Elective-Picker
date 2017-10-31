import {Component, Input, OnInit} from '@angular/core';
import {Elective} from '../../classes/elective';
import {ElectiveDataService} from '../../elective-data-service';

declare const Visualforce: any;

@Component({
  selector: 'iee-elective',
  templateUrl: './elective.component.html',
  styleUrls: ['./elective.component.css']
})
export class ElectiveComponent implements OnInit {
  @Input() elective: Elective;
  @Input() isPrimary: boolean;
  @Input() isDisabled: boolean;
  @Input() index: number;
  @Input() displayTimeHeaders: boolean;
  @Input() electives: Elective[];
  educationId: string;

  get isChecked(): boolean {
    return this.elective.isPrimary || this.elective.isAlternate;
  }

  constructor(private electiveDataService: ElectiveDataService) {
  }

  ngOnInit() {
    this.electiveDataService.educationId.asObservable().subscribe({
      next: value => {
        this.educationId = value;
      }
    });
  }

  onCheckChange(isDisabled: boolean) {
    if (this.isPrimary) {
      this.electives.forEach(elective => {
        elective.isUpdating = true;
      });
    }
    const coReq: Elective = this.getCoReqElective();
    if (!isDisabled) {
      if (this.isPrimary === true) {
        this.elective.isPrimary = !this.elective.isPrimary;
        if (coReq) {
          coReq.isPrimary = !coReq.isPrimary;
        }
      } else {
        this.elective.isAlternate = !this.elective.isAlternate;
        if (coReq) {
          coReq.isAlternate = !coReq.isAlternate;
        }
      }

      if (this.isChecked) { // a little backwards because we've just checked it, so save to DB
        this.elective.insertIntoSalesforce(this.educationId).then(result => {
          // if co-req exists, insert it also
          if (coReq) {
            coReq.insertIntoSalesforce(this.educationId).then(coReqResult => {
              if (this.isPrimary) {
                this.electiveDataService.updateAvailabilityCounts();
              }
            });
          } else {
            // update availability counts
            if (this.isPrimary) {
              this.electiveDataService.updateAvailabilityCounts();
            }
          }
        });
      } else { // again... not checked means we just unchecked it so we'll delete it
        this.elective.deleteFromSalesforce().then(result => {
          // if co-req exists, delete it also
          if (coReq) {
            coReq.deleteFromSalesforce().then(coReqResult => {
              if (this.isPrimary) {
                this.electiveDataService.updateAvailabilityCounts();
              }
            });
          } else {
            if (this.isPrimary) {
              this.electiveDataService.updateAvailabilityCounts();
            }
          }
        })
      }
    }
  }

  getCoReqName(): string {
    let coReqName = '';
    if (this.elective.electiveCorequisiteId && this.electives) {
      for (let i = 0; i < this.electives.length; i++) {
        // console.log('getCoReqName() eId: ' + this.electives[i].id + ' / coreqId: ' + this.elective.electiveCorequisiteId);
        if (this.electives[i].id === this.elective.electiveCorequisiteId) {
          // console.log('found co-req');
          coReqName = this.electives[i].courseDescription;
        }
      }
    }

    return coReqName;
  }

  getCoReqElective(): Elective {
    if (this.elective.electiveCorequisiteId && this.electives) {
      for (let i = 0; i < this.electives.length; i++) {
        // console.log('getCoReqElective() eId: ' + this.electives[i].id + ' / coreqId: ' + this.elective.electiveCorequisiteId);
        if (this.electives[i].id === this.elective.electiveCorequisiteId) {
          // console.log('found co-req');
          return this.electives[i];
        }
      }
    }

    return null;
  }

  isPreviousTimeDifferent(): boolean {
    if (this.index > 0) {
      if (this.elective.startPeriod !== this.electives[this.index - 1].startPeriod) {
        return true;
      }
    } else {
      return true;
    }

    return false;
  }
}
