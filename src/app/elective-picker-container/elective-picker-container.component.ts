import {Component, DoCheck, Input, OnInit} from '@angular/core';
import {Elective} from '../classes/elective';
import {ElectiveDataService} from '../services/elective-data-service';
import {FilterListItem} from '../classes/filter-list-item';

@Component({
  selector: 'iee-elective-picker-container',
  templateUrl: './elective-picker-container.component.html',
  styleUrls: ['./elective-picker-container.component.less']
})
export class ElectivePickerContainerComponent implements OnInit, DoCheck {
  electiveOptionsType = 'primary';
  private _oldTabIndex = 0;
  @Input() electives: Elective[];
  @Input() tabIndex: number;
  private typeFilters: FilterListItem[] = [];

  constructor(private electiveDataService: ElectiveDataService) {
  }

  ngDoCheck(): void {
    if (this._oldTabIndex !== this.tabIndex) {
      this.electiveOptionsType = 'primary';
      this._oldTabIndex = this.tabIndex;
    }
  }

  ngOnInit() {
    this.electiveDataService.typeFilterList.asObservable().subscribe({
      next: filters => {
        this.typeFilters = filters;
      }
    });
  }

  onClickTypeOption(type: string) {
    // only reset the list of filters if the prim/alt actually changes
    if (this.electiveOptionsType !== type) {
      this.typeFilters.forEach(f => {
        f.isSelected = false;
      });
    }
    this.electiveOptionsType = type;
  }

  get availableElectiveTypes(): string[] {
    const availableTypes: Set<string> = new Set<string>();

    this.electives.forEach(e => {
      availableTypes.add(e.electiveType);
    });

    return Array.from(availableTypes);
  }
}
