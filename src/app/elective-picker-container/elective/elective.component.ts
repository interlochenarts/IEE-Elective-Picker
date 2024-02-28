import {
  AfterViewInit, Component, DoCheck, ElementRef, Input, OnChanges, OnInit, Renderer2,
  ViewChild
} from '@angular/core';
import {Elective} from '../../classes/elective';
import {ElectiveDataService} from '../../services/elective-data-service';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {ModalService} from '../../services/modal.service';

declare const Visualforce: any;

@Component({
  selector: 'iee-elective',
  templateUrl: './elective.component.html',
  styleUrls: ['./elective.component.less'],
  animations: [
    trigger('shrinkGrow', [
      state('in', style({height: '*', padding: '0.75em'})),
      transition(':leave', [
        style({height: '*', padding: '0.75em'}),
        animate('300ms 0ms ease-in', style({height: 0, padding: 0}))
      ]),
      transition('void => in', [
        style({height: 0, padding: 0}),
        animate('300ms 0ms ease-out', style({height: '*', padding: '0.75em'}))
      ])
    ]),
    trigger('appearDelayed', [
      transition(':enter', [
        style({color: 'white'}),
        animate('0ms 300ms', style({color: 'inherit'}))
      ])
    ])
  ]
})
export class ElectiveComponent implements OnInit, AfterViewInit, DoCheck, OnChanges {
  @Input() elective: Elective;
  @Input() isPrimary: boolean;
  @Input() isDisabled: boolean;
  @Input() index: number;
  @Input() displayTimeHeaders: boolean;
  @Input() electives: Elective[];
  @Input() coRequisite: Elective;
  @Input() isDisplayed: boolean;
  educationId: string;
  endAnimation: Function;
  @ViewChild('availableSlotsElement') availableSlotsElement;
  private _previousAvailableSlots: number;

  get isChecked(): boolean {
    return !!this.elective.courseRequestId && (this.elective.isPrimary || this.elective.isAlternate);
  }

  get checking(): boolean {
    return this.elective.isPrimary || this.elective.isAlternate;
  }

  get isSpinning(): boolean {
    return !this.elective.courseRequestId && (this.elective.isPrimary || this.elective.isAlternate)
      || (this.elective.courseRequestId && this.elective.isDeleting);
  }

  constructor(private electiveDataService: ElectiveDataService,
              private renderer: Renderer2,
              private modalService: ModalService) {
  }

  ngOnInit() {
    this.electiveDataService.educationId.asObservable().subscribe({
      next: value => {
        this.educationId = value;
      }
    });
    this._previousAvailableSlots = this.elective.availableSlots;
  }

  ngAfterViewInit() {
    if (this.isPrimary && this.availableSlotsElement) {
      this.endAnimation = this.renderer.listen(this.availableSlotsElement.nativeElement, 'animationend', evt => {
        this.availableSlotsElement.nativeElement.classList.remove('bouncer');
      });
    }
  }

  ngDoCheck() {
    if (this.isPrimary && this.availableSlotsElement && this.elective.availableSlots !== this._previousAvailableSlots) {
      this.availableSlotsElement.nativeElement.classList.add('bouncer');
      this._previousAvailableSlots = this.elective.availableSlots;
    }
  }

  ngOnChanges() {
    if (this.isPrimary && this.availableSlotsElement && this.elective.availableSlots !== this._previousAvailableSlots) {
      this.availableSlotsElement.nativeElement.classList.add('bouncer');
      this._previousAvailableSlots = this.elective.availableSlots;
    }
  }

  onCheckChange(isDisabled: boolean) {
    if (!isDisabled) {
      if (this.isPrimary === true) {
        this.elective.isPrimary = !this.elective.isPrimary;
        this.elective.isUpdating = true;
        if (this.coRequisite) {
          this.coRequisite.isPrimary = !this.coRequisite.isPrimary;
          this.coRequisite.isUpdating = true;
        }
      } else {
        this.elective.isAlternate = !this.elective.isAlternate;
        if (this.coRequisite) {
          this.coRequisite.isAlternate = !this.coRequisite.isAlternate;
        }
      }

      if (this.checking) {
        this.elective.insertIntoSalesforce(this.educationId).then(result => {
          // if co-req exists, insert it also
          if (this.coRequisite) {
            setTimeout(() => {
              this.coRequisite.insertIntoSalesforce(this.educationId).then(coReqResult => {});
            }, 1000);
          }
        });
      } else {
        this.elective.deleteFromSalesforce().then(result => {
          // if co-req exists, delete it also
          if (this.coRequisite) {
            setTimeout(() => {
              this.coRequisite.deleteFromSalesforce().then(coReqResult => {});
            }, 1000);
          }
        });
      }
    }
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

  showDescriptionPopup(): void {
    this.modalService.modalContent.next(this.elective.courseDetail);
    this.modalService.modalVisible.next(true);
    this.modalService.modalTitle.next(this.elective.courseDescription);
  }
}
