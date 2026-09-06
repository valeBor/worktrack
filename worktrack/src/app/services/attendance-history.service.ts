import { Injectable } from '@angular/core';
import { HttpClient, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';
import {HistorialAsistencia, PeriodoHistorial, UsuarioHistorialGestionable} from '../models/historial-asistencia.model';

@Injectable({
  providedIn: 'root'
})
export class  AttendanceHistoryService {
  private readonly apiUrl =
    'http://localhost:3000/api/asistencias';

  constructor(
    private http: HttpClient
  ) {}

  // ====================================================
  // OBTENER MI HISTORIAL
  // ====================================================

  getMyHistory(
    periodo: PeriodoHistorial = 'mes_actual'
  ): Observable<HistorialAsistencia> {
    const params = new HttpParams().set(
      'periodo',
      periodo
    );

    return this.http.get<HistorialAsistencia>(
      `${this.apiUrl}/mia/historial`,
      {params}
    );
  }

  // ====================================================
  // OBTENER USUARIOS GESTIONABLES
  // ====================================================

   getManageableUsers():
    Observable<UsuarioHistorialGestionable[]> {
    return this.http.get<
      UsuarioHistorialGestionable[]
    >(
      `${this.apiUrl}/historial/usuarios-gestionables`
    );
  }

  // ====================================================
  // OBTENER HISTORIAL DE UN USUARIO
  // ====================================================

   getUserHistory(
    usuarioId: number,
    periodo: PeriodoHistorial = 'mes_actual'
  ): Observable<HistorialAsistencia> {
    const params = new HttpParams().set(
      'periodo',
      periodo
    );

    return this.http.get<HistorialAsistencia>(
      `${this.apiUrl}/historial/usuario/${usuarioId}`,
      {params}
    );
  }
}