import {Component, OnInit} from '@angular/core';
import {Elective} from '../classes/elective';
import {ElectiveDataService} from '../services/elective-data-service';
import {Education} from '../classes/education';

@Component({
  selector: 'iee-tab-container',
  templateUrl: './tab-container.component.html',
  styleUrls: ['./tab-container.component.css']
})
export class TabContainerComponent implements OnInit {
  education: Education;
  electives: Elective[] = [];
  activeTabSession: string;
  activeProgramMajorId: string;
  reviewAndSubmitActive = false;
  programMajorIds: Array<string> = [];

  // programNamesByProgramMajorIds: Array<string> = [];

  constructor(private electiveDataService: ElectiveDataService) {
  }

  ngOnInit() {
    const url: URL = new URL(document.location.toString());
    const params: URLSearchParams = url.searchParams;
    // push the new education Id to the service and update the data
    this.electiveDataService.educationId.next(params.get('eid'));

    this.electiveDataService.education.asObservable().subscribe({
      next: data => {
        this.education = data;
        this.programMajorIds = this.education.programMajorIds;
        this.onChangeTab(0);
      }
    });
  }

  onChangeTab(index: number) {
    this.reviewAndSubmitActive = false;
    this.activeProgramMajorId = this.education.programMajorIds[index];
    this.electiveDataService.activeProgramMajorId.next(this.activeProgramMajorId);
    this.activeTabSession = this.education.sessionsByProgramMajorIds[this.activeProgramMajorId];
    this.electives = this.education.electivesByProgramMajorIds[this.activeProgramMajorId];
    window.scrollTo(0, 0);
  }

  onReviewAndSubmitClicked() {
    this.activeProgramMajorId = null;
    this.electiveDataService.activeProgramMajorId.next(null);
    this.reviewAndSubmitActive = true;
    this.activeTabSession = null;
    window.scrollTo(0, 0);
  }

  get tabIndex(): number {
    let index = this.programMajorIds.indexOf(this.activeProgramMajorId);
    if (index < 0) {
      if (this.reviewAndSubmitActive) {
        index = this.programMajorIds.length;
      } else {
        index = 0;
      }
    }

    return index;
  }

  get electivesUnavailable(): boolean {
    return (!this.education.electivesByProgramMajorIds[this.activeProgramMajorId])
      || (this.education.electivesByProgramMajorIds[this.activeProgramMajorId].length === 0);
  }

  get electiveSlotsAvailable(): boolean {
    const electives = this.education.electivesByProgramMajorIds[this.activeProgramMajorId];
    if (electives) {
      return electives.reduce((open: boolean, elective) => open || elective.availableSlots > 0, false);
    }

    return true;
  }

  get electiveChoicesStarted(): boolean {
    const electives = this.education.electivesByProgramMajorIds[this.activeProgramMajorId];
    if (electives) {
      return electives.reduce((selected: boolean, elective) => selected || elective.isPrimary || elective.isAlternate, false);
    }

    return true;
  }

  prevTab() {
    this.onChangeTab(this.tabIndex - 1);
    this.reviewAndSubmitActive = false;
  }

  nextTab() {
    if (this.tabIndex === (this.programMajorIds.length - 1)) {
      this.onReviewAndSubmitClicked();
    } else {
      this.onChangeTab(this.tabIndex + 1);
      this.reviewAndSubmitActive = false;
    }
  }

  get nextTabName(): string {
    if (this.tabIndex === (this.programMajorIds.length - 1)) {
      return 'Review & Submit';
    } else {
      const pmId = this.programMajorIds[this.tabIndex + 1];
      return this.education.programNamesByProgramMajorIds[pmId] + ' - ' + this.education.sessionsByProgramMajorIds[pmId];
    }
  }
}
