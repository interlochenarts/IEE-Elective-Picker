import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PicklistFilterComponent } from './picklist-filter.component';

describe('PicklistFilterComponent', () => {
  let component: PicklistFilterComponent;
  let fixture: ComponentFixture<PicklistFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PicklistFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PicklistFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
