import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {ElectivesComponent} from './elective-picker-container/electives/electives.component';
import {ElectiveComponent} from './elective-picker-container/elective/elective.component';
import {ElectivesSelectedComponent} from './elective-picker-container/electives-selected/electives-selected.component';
import {ElectivePickerContainerComponent} from './elective-picker-container/elective-picker-container.component';
import {ReviewContainerComponent} from './review-container/review-container.component';
import {ElectiveDataService} from './services/elective-data-service';
import {TabContainerComponent} from './tab-container/tab-container.component';
import {ElectiveCriteriaContainerComponent} from './elective-criteria-container/elective-criteria-container.component';
import {CriteriaCheckService} from './services/criteria-check.service';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { ModalContainerComponent } from './modal-container/modal-container.component';

@NgModule({
  declarations: [
    AppComponent,
    ElectivesComponent,
    ElectiveComponent,
    ElectivesSelectedComponent,
    ElectivePickerContainerComponent,
    ReviewContainerComponent,
    TabContainerComponent,
    ElectiveCriteriaContainerComponent,
    ModalContainerComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule
  ],
  providers: [ElectiveDataService, CriteriaCheckService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
