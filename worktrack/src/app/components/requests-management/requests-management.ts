import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ScheduleChangeRequests} from '../schedule-change-requests/schedule-change-requests';
import {AbsenceJustificationRequests} from '../absence-justification-requests/absence-justification-requests';

type RequestsManagementTab =
  | 'SCHEDULE_CHANGES'
  | 'ABSENCE_JUSTIFICATIONS';

@Component({
  selector: 'app-requests-management',
  standalone: true,
  imports: [
    CommonModule,
    ScheduleChangeRequests,
    AbsenceJustificationRequests
  ],
  templateUrl: './requests-management.html',
  styleUrl: './requests-management.css'
})
export class RequestsManagement {
  activeTab: RequestsManagementTab = 'SCHEDULE_CHANGES';

  selectTab(tab: RequestsManagementTab): void {
    this.activeTab = tab;
  }
}
