export class FilterListItem {
  isSelected: boolean;
  description: string;

  constructor(selected: boolean, desc: string) {
    this.isSelected = selected;
    this.description = desc;
  }
}
