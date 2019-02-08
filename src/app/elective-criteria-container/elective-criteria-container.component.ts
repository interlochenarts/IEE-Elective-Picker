import {Component, DoCheck, Input, OnChanges, OnInit} from '@angular/core';
import {ElectiveCriterion} from '../classes/elective-criterion';
import {ElectiveDataService} from '../services/elective-data-service';
import {Elective} from '../classes/elective';
import {Education} from '../classes/education';
import {CriteriaCheckService} from '../services/criteria-check.service';
import {TypeCount} from '../classes/type-count';
import {ElectiveCriteriaGroup} from '../classes/elective-criteria-group';

@Component({
  selector: 'iee-elective-criteria-container',
  templateUrl: './elective-criteria-container.component.html',
  styleUrls: ['./elective-criteria-container.component.css']
})
export class ElectiveCriteriaContainerComponent implements OnInit, DoCheck, OnChanges {
  @Input() activeProgramMajorId: string;
  education: Education;
  electives: Elective[] = [];
  electiveCriteria = new Map<string, ElectiveCriterion[]>();
  periodCriteria: ElectiveCriterion[] = [];
  typeCriteria: ElectiveCriteriaGroup[] = [];
  criteriaTypeCounts: TypeCount[] = [];
  electiveTypeCounts: TypeCount[] = [];
  private criteriaSatisfiedTypeCounts: TypeCount[] = [];
  criteriaMap: Map<string, number> = new Map<string, number>();
  private _oldElectiveLength = 0;

  get primaryElectives(): Elective[] {
    return this.electives.filter((elective) => {
      return elective.isPrimary;
    });
  }

  constructor(private electiveDataService: ElectiveDataService, private criteriaCheckService: CriteriaCheckService) {
  }

  ngDoCheck(): void {
    if (this.activeProgramMajorId && this.electiveCriteria.get(this.activeProgramMajorId)) {
      if (this._oldElectiveLength !== this.primaryElectives.length) {
        this._oldElectiveLength = this.primaryElectives.length;
        this.initializeElectives();
        this.updateData();
      }
    }
  }

  ngOnInit(): void {
    this.electiveDataService.electiveCriteria.asObservable().subscribe({
      next: data => {
        if (data) {
          this.electiveCriteria = data;
          this.initializeCriteriaLists();
          this.updateData();
        }
      }
    });

    this.electiveDataService.education.asObservable().subscribe({
      next: data => {
        this.education = data;
        this.initializeElectives();
      }
    });
  }

  ngOnChanges(): void {
    if (this.activeProgramMajorId && this.electiveCriteria.get(this.activeProgramMajorId)) {
      this.initializeElectives();
      this.initializeCriteriaLists();
      this.updateData();
      this._oldElectiveLength = 0;
    }
  }

  updateData(): void {
    if (this.education) {
      this.criteriaMap = this.criteriaCheckService.buildTypeCriteriaMap(this.typeCriteria,
        this.education.sessionsByProgramMajorIds[this.activeProgramMajorId]);
    }
    this.criteriaTypeCounts = this.criteriaCheckService.buildCriteriaCounts(this.criteriaMap);
    this.electiveTypeCounts = this.criteriaCheckService.getElectiveTypeChosenCounts(this.primaryElectives);
    if (this.education && this.electiveCriteria) {
      this.criteriaSatisfiedTypeCounts = this.criteriaCheckService.getCriteriaTypeSatisfiedCounts(this.electiveTypeCounts,
        this.electiveCriteria.get(this.activeProgramMajorId).filter(c => c.requirementType === 'type'),
        this.education.sessionsByProgramMajorIds[this.activeProgramMajorId]);
    }
    this.electiveDataService.closedTypes.next(
      this.criteriaCheckService.checkClosedTypes(this.criteriaTypeCounts, this.criteriaSatisfiedTypeCounts)
    );

    this.criteriaCheckService.checkCriteriaCheckMarks(this.typeCriteria, this.primaryElectives, this.criteriaMap);

    this.electiveDataService.closedPeriods.next(
      this.criteriaCheckService.checkClosedPeriods(this.periodCriteria, this.primaryElectives)
    );

    this.criteriaCheckService.countAvailableCriteria(this.typeCriteria, true);
  }

  initializeElectives() {
    this.electives = this.education.electivesByProgramMajorIds[this.activeProgramMajorId];
  }

  initializeCriteriaLists() {
    this.typeCriteria = this.criteriaCheckService.initializeTypeCriteriaList(this.activeProgramMajorId, this.electiveCriteria);
    this.periodCriteria = this.criteriaCheckService.initializePeriodCriteriaList(this.activeProgramMajorId, this.electiveCriteria);
  };
}
