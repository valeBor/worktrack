import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {
  AttendanceHistoryQuery,
  AttendanceStatistics,
  AttendanceStatisticsQuery,
  DailyAttendanceReport,
  GlobalAttendanceHistory,
  ReportableUser
} from '../models/attendance-report.model';

@Injectable({
  providedIn: 'root'
})
export class AttendanceReportService {
  private readonly apiUrl =
    'http://localhost:3000/api/reportes-asistencia';

  constructor(
    private http: HttpClient
  ) {}

  // ====================================================
  // USUARIOS REPORTABLES
  // ====================================================

  getReportableUsers():
    Observable<ReportableUser[]> {
    return this.http.get<
      ReportableUser[]
    >(
      `${this.apiUrl}/usuarios`
    );
  }

  // ====================================================
  // REPORTE DIARIO
  // ====================================================

  getDailyReport(
    fecha?: string
  ): Observable<DailyAttendanceReport> {
    let params = new HttpParams();

    if (fecha) {
      params = params.set(
        'fecha',
        fecha
      );
    }

    return this.http.get<
      DailyAttendanceReport
    >(
      `${this.apiUrl}/diario`,
      {params}
    );
  }

  // ====================================================
  // HISTORIAL GLOBAL
  // ====================================================

  getGlobalHistory(
    filtros: AttendanceHistoryQuery = {}
  ): Observable<GlobalAttendanceHistory> {
    let params = new HttpParams();

    if (filtros.fechaDesde) {
      params = params.set(
        'fechaDesde',
        filtros.fechaDesde
      );
    }

    if (filtros.fechaHasta) {
      params = params.set(
        'fechaHasta',
        filtros.fechaHasta
      );
    }

    if (filtros.usuarioId) {
      params = params.set(
        'usuarioId',
        filtros.usuarioId.toString()
      );
    }

    if (filtros.role) {
      params = params.set(
        'role',
        filtros.role
      );
    }

    if (filtros.estado) {
      params = params.set(
        'estado',
        filtros.estado
      );
    }

    return this.http.get<
      GlobalAttendanceHistory
    >(
      `${this.apiUrl}/historial`,
      {params}
    );
  }

  // ====================================================
  // ESTADÍSTICAS
  // ====================================================

  getStatistics(
    filtros: AttendanceStatisticsQuery = {}
  ): Observable<AttendanceStatistics> {
    let params = new HttpParams();

    if (filtros.fechaDesde) {
      params = params.set(
        'fechaDesde',
        filtros.fechaDesde
      );
    }

    if (filtros.fechaHasta) {
      params = params.set(
        'fechaHasta',
        filtros.fechaHasta
      );
    }

    if (filtros.usuarioId) {
      params = params.set(
        'usuarioId',
        filtros.usuarioId.toString()
      );
    }

    if (filtros.role) {
      params = params.set(
        'role',
        filtros.role
      );
    }

    return this.http.get<
      AttendanceStatistics
    >(
      `${this.apiUrl}/estadisticas`,
      {params}
    );
  }
}