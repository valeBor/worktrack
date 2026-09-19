import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ManualAttendanceContext,
  ManualAttendanceRecord,
  ManualAttendanceRequest,
  ManualAttendanceResponse,
  ManualAttendanceUser, ManualExitCompletionRequest
} from '../models/manual-attendance.model';

@Injectable({ providedIn: 'root' })
export class ManualAttendanceService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/asistencias/manual`;

  getUsers(): Observable<ManualAttendanceUser[]> {
    return this.http.get<ManualAttendanceUser[]>(`${this.api}/usuarios-gestionables`);
  }

  getContext(userId: number): Observable<ManualAttendanceContext> {
    return this.http.get<ManualAttendanceContext>(`${this.api}/contexto/${userId}`);
  }

  getRecords(): Observable<ManualAttendanceRecord[]> {
    return this.http.get<ManualAttendanceRecord[]>(`${this.api}/registros`);
  }

  register(data: ManualAttendanceRequest): Observable<ManualAttendanceResponse> {
    return this.http.post<ManualAttendanceResponse>(this.api, data);
  }

  completeExit(
    attendanceId: number,
    data: ManualExitCompletionRequest
  ): Observable<ManualAttendanceResponse> {
    return this.http.patch<ManualAttendanceResponse>(
      `${this.api}/${attendanceId}/salida`,
      data
    );
  }
}