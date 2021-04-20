import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {FilterListItem} from '../../classes/filter-list-item';
import {ElectiveDataService} from '../../services/elective-data-service';

declare const Visualforce: any;

@Component({
  selector: 'iee-picklist-filter',
  templateUrl: './picklist-filter.component.html',
  styleUrls: ['./picklist-filter.component.css']
})
export class PicklistFilterComponent implements OnInit {
  @ViewChild('dropdownModal', { static: true }) dropdownModal: any;
  @Input() availableTypes: string[];
  dropDownIsVisible = false;
  filterList: FilterListItem[] = [];

  constructor(private electiveDataService: ElectiveDataService) {
  }

  get selectedListItems(): FilterListItem[] {
    return this.filterList.filter(item => {
      return item.isSelected;
    });
  }

  ngOnInit() {
    // initialize filter list
    Visualforce.remoting.Manager.invokeAction(
      'IEE_ElectivePicker_Controller.getElectiveTypesForFilter',
      json => {
        // console.log(json);
        const filterTypes: string[] = JSON.parse(json);
        this.filterList = filterTypes.filter(t => {
          return this.availableTypes.indexOf(t) >= 0;
        }).map(t => {
          return new FilterListItem(false, t);
        });
        this.electiveDataService.typeFilterList.next(this.filterList);
      },
      {buffer: false, escape: false}
    );
  }

  onClickDropDown() {
    this.dropDownIsVisible = !this.dropDownIsVisible;
    if (this.dropDownIsVisible === true) {
      this.growModal();
    } else {
      this.shrinkModal()
    }
  }

  onCloseDropdown() {
    this.dropDownIsVisible = false;
    this.shrinkModal();
  }

  growModal(): void {
    // modal should open also
    const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
    const viewWidth = Math.max(document.documentElement.clientWidth, window.innerWidth);

    this.dropdownModal.nativeElement.style.height = viewHeight + 'px';
    this.dropdownModal.nativeElement.style.width = viewWidth + 'px';
    this.dropdownModal.nativeElement.style.display = 'block';
  }

  shrinkModal(): void {
    this.dropdownModal.nativeElement.style.height = 0;
    this.dropdownModal.nativeElement.style.width = 0;
    this.dropdownModal.nativeElement.style.display = 'none';
  }

  onRemoveSelectedItem(item: FilterListItem): void {
    item.isSelected = false;
  }

  onRemoveAllItems() {
    this.filterList.map(item => {
      item.isSelected = false;
    });
  }
}
