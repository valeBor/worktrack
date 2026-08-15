import { Injectable, inject } from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

import {
  Horario,
  HorarioNuevo,
  CrearHorarioResponse
} from '../models/horario.model';


@Injectable({
  providedIn: 'root'
})
export class HorarioService {

  private http =
    inject(HttpClient);


  private apiUrl =
    'http://localhost:3000/api/horarios';


  // ====================================================
  // OBTENER TODOS LOS CRONOGRAMAS
  // ====================================================

  getHorarios():
    Observable<Horario[]> {

    return this.http.get<Horario[]>(
      this.apiUrl
    );

  }


  // ====================================================
  // HORARIOS DE UN EMPLEADO
  // ====================================================

  getHorariosUsuario(
    usuarioId: number
  ): Observable<Horario[]> {

    return this.http.get<Horario[]>(
      `${this.apiUrl}/usuario/${usuarioId}`
    );

  }


  // ====================================================
  // HORARIO DEL USUARIO LOGUEADO PARA HOY
  // ====================================================

  getMiHorarioHoy():
    Observable<Horario> {

    return this.http.get<Horario>(
      `${this.apiUrl}/mio/hoy`
    );

  }


  // ====================================================
  // CREAR CRONOGRAMA
  // ====================================================

  createHorario(
    horario: HorarioNuevo
  ): Observable<CrearHorarioResponse> {

    return this.http.post<CrearHorarioResponse>(
      this.apiUrl,
      horario
    );

  }


  // ====================================================
  // MODIFICAR
  // ====================================================

  updateHorario(
    id: number,
    horario: Partial<Horario>
  ): Observable<{ mensaje: string }> {

    return this.http.put<{ mensaje: string }>(
      `${this.apiUrl}/${id}`,
      horario
    );

  }


  // ====================================================
  // ELIMINAR
  // ====================================================

  deleteHorario(
    id: number
  ): Observable<{ mensaje: string }> {

    return this.http.delete<{ mensaje: string }>(
      `${this.apiUrl}/${id}`
    );

  }

}