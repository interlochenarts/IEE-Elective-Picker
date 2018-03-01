import {Component, Input, OnInit} from '@angular/core';
import {FilterListItem} from '../../../classes/filter-list-item';

@Component({
  selector: 'iee-list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.css']
})
export class ListItemComponent implements OnInit {
  @Input() listItem: FilterListItem;

  constructor() {
  }

  ngOnInit() {
  }

  onChangeSelected(): void {
    this.listItem.isSelected = !this.listItem.isSelected;
  }
}
