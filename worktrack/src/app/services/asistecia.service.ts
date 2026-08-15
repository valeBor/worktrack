import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  RegistrarAsistenciaRequest,
  RegistrarAsistenciaResponse,
  AsistenciaHoy
} from '../models/asistencia.model';

@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {

  private apiUrl =
    'http://localhost:3000/api/asistencias';

  constructor(
    private http: HttpClient
  ) {}

  registrarAsistencia(
    data: RegistrarAsistenciaRequest
  ): Observable<RegistrarAsistenciaResponse> {

    return this.http.post<RegistrarAsistenciaResponse>(
      `${this.apiUrl}/registrar`,
      data
    );
  }

  obtenerMiAsistenciaHoy():
    Observable<AsistenciaHoy> {

    return this.http.get<AsistenciaHoy>(
      `${this.apiUrl}/mia/hoy`
    );
  }
}