import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Header} from '../../components/header/header';
import {ScheduleChange} from '../../components/schedule-change/schedule-change';
import {AbsenceJustification} from '../../components/absence-justification/absence-justification';

type RequestsTab = 'schedule' | 'absence';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, Header, ScheduleChange, AbsenceJustification],
  templateUrl: './requests.html',
  styleUrl: './requests.css'
})
export class Requests {
  activeTab: RequestsTab = 'schedule';

  selectTab(tab: RequestsTab): void {
    this.activeTab = tab;
  }
}