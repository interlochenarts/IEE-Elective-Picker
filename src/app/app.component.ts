import {
  Component, ComponentFactoryResolver, ComponentRef, OnInit, Renderer2, ViewChild,
  ViewContainerRef
} from '@angular/core';
import {ElectiveDataService} from './services/elective-data-service';
import {Education} from './classes/education';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/combineLatest';
import {ModalContainerComponent} from './modal-container/modal-container.component';
import {ModalService} from './services/modal.service';

@Component({
  selector: 'iee-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  entryComponents: [
    ModalContainerComponent
  ]
})
export class AppComponent implements OnInit {
  @ViewChild('floatLink') floatLink: any;
  @ViewChild('modalContainer', {read: ViewContainerRef}) modalContainer: ViewContainerRef;
  education: Education;
  activeProgramMajorId: string;
  longDescription = '';
  modalRef: ComponentRef<ModalContainerComponent>;

  constructor(private electiveDataService: ElectiveDataService,
              private renderer: Renderer2,
              private modalService: ModalService,
              private componentFactoryResolver: ComponentFactoryResolver) {
    this.renderer.listen('window', 'scroll', evt => {

      const scrollDistance = 150;
      if (document.body.scrollTop > scrollDistance || document.documentElement.scrollTop > scrollDistance) {
        this.floatLink.nativeElement.style.display = 'block';
      } else {
        this.floatLink.nativeElement.style.display = 'none';
      }

      // detect visible portion of footer and add 10 to keep link above it
      const footerElement = document.getElementById('footer-target');
      const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
      const footerBound: ClientRect = footerElement.getBoundingClientRect();
      const footerTop = (viewHeight - footerBound.top) > 0 ? viewHeight - footerBound.top : 0;

      this.floatLink.nativeElement.style.bottom = (10 + footerTop) + 'px';
    });
  }

  ngOnInit() {
    const edObs = this.electiveDataService.education.asObservable();
    const pmIdObs = this.electiveDataService.activeProgramMajorId.asObservable();

    Observable.combineLatest(edObs, pmIdObs).subscribe(obs => {
      [this.education, this.activeProgramMajorId] = obs;
      this.updateDescriptionText();
    });

    this.modalService.modalVisible.asObservable().subscribe({
      next: modalVisible => {
        if (modalVisible) {
          const factory = this.componentFactoryResolver.resolveComponentFactory(ModalContainerComponent);
          this.modalRef = this.modalContainer.createComponent(factory)
        } else {
          if (this.modalRef) {
            this.modalRef.destroy();
          }
        }
      }
    });
  }

  updateDescriptionText() {
    if (!this.activeProgramMajorId || this.activeProgramMajorId === null) {
      // build list of all long descriptions
      this.longDescription = '';
      // put default text at beginning? Should probably be stored on SFDC somewhere for easy updating

      const descriptionSet: Set<string> = new Set<string>();

      this.education.programMajorIds.forEach((pmId, index, array) => {
        if (this.education.longDescriptionsByProgramMajorIds[pmId]
          && this.education.longDescriptionsByProgramMajorIds[pmId] !== null) {

          descriptionSet.add(this.education.longDescriptionsByProgramMajorIds[pmId]);
        }
      });

      Array.from(descriptionSet).forEach((description, index, array) => {
        this.longDescription += description;

        if (index < array.length - 1) {
          this.longDescription += '<hr />';
        }
      });
    } else {
      this.longDescription = this.education.longDescriptionsByProgramMajorIds[this.activeProgramMajorId];
    }
  }

  get showPrivateLessonInstructions(): boolean {
    // The !! is to force returning a boolean. Should never return the totalWeeks, which is a number type.
    return !!(this.education && this.education.privateLessonFormActive
      && this.education.totalWeeksAttending && this.education.totalWeeksAttending >= 3
      && (this.activeProgramMajorId !== null || this.education.privateLessonFormSubmitted === true));
  }

  get privateLessonFormLink(): string {
    let queryString = '?';
    queryString += 'studentName[first]=' + encodeURI(this.education.studentFirstName);
    queryString += '&studentName[last]=' + encodeURI(this.education.studentLastName);
    queryString += '&emailAddress=' + encodeURI(this.education.currentUserEmail).replace(/\+/g, '{plusSign}');
    queryString += '&division=' + encodeURI(this.education.division);
    queryString += '&session=' + encodeURI(this.education.sessionsByProgramMajorIds[this.activeProgramMajorId]);
    queryString += '&educationId=' + encodeURI(this.education.educationId);

    // production link
    // const url = 'https://jotform.com/73405988648170';

    // development link
    const url = 'https://jotform.com/80465546948167';

    return url + queryString;
  }

  get privateLessonInstructions(): string {
    if (this.education.privateLessonFormSubmitted === false) {
      return '<p>A Private Lesson elective may be requested in the place of one of the elective selections made on this page.</p>' +
        '<p>To be eligible, the student must have at least three years of experience on the instrument, and ' +
        'there is an additional fee of $115 per week.</p>' +
        '<p>If you are interested in requesting a Private Lesson elective, ' +
        '<a class="privateLessonLink" href="' + this.privateLessonFormLink + '">please complete this form.</a></p>' +
        '<p>Please submit elective requests in addition to completing this form. We are not able guarantee placement in private ' +
        'lesson electives.</p>';
    } else {
      return 'You have submitted a private lesson elective request for this summer.';
    }
  }

  toTop(): void {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }
}
