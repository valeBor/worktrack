import {Injectable, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Horario, HorarioNuevo, GuardarHorarioResponse,EliminarHorarioResponse
} from '../models/horario.model';
import {User} from '../models/user.models';

@Injectable({providedIn: 'root'})
export class HorarioService {
  private http = inject(HttpClient);

  private apiUrl =
    'http://localhost:3000/api/horarios';

  // ====================================================
  // USUARIOS GESTIONABLES SEGÚN EL ROL
  // ====================================================

  getUsuariosGestionables(): Observable<User[]> {
    return this.http.get<User[]>(
      `${this.apiUrl}/usuarios-gestionables`
    );
  }

  // ====================================================
  // OBTENER CRONOGRAMAS PERMITIDOS
  // ====================================================

  getHorarios(): Observable<Horario[]> {
    return this.http.get<Horario[]>(
      this.apiUrl
    );
  }

  // ====================================================
  // HORARIOS DE UN USUARIO
  // ====================================================

  getHorariosUsuario(
    usuarioId: number
  ): Observable<Horario[]> {
    return this.http.get<Horario[]>(
      `${this.apiUrl}/usuario/${usuarioId}`
    );
  }

  // ====================================================
  // HORARIO PROPIO DE HOY
  // ====================================================

  getMiHorarioHoy(): Observable<Horario> {
    return this.http.get<Horario>(
      `${this.apiUrl}/mio/hoy`
    );
  }

  // ====================================================
  // CREAR CRONOGRAMA
  // ====================================================

  createHorario(
    horario: HorarioNuevo
  ): Observable<GuardarHorarioResponse> {
    return this.http.post<GuardarHorarioResponse>(
      this.apiUrl,
      horario
    );
  }

  // ====================================================
  // ACTUALIZAR CRONOGRAMA COMPLETO
  // ====================================================

  updateCronogramaUsuario(
    usuarioId: number,
    horario: HorarioNuevo
  ): Observable<GuardarHorarioResponse> {
    return this.http.put<GuardarHorarioResponse>(
      `${this.apiUrl}/usuario/${usuarioId}`,
      horario
    );
  }

  // ====================================================
  // ELIMINAR CRONOGRAMA COMPLETO
  // ====================================================

  deleteCronogramaUsuario(
    usuarioId: number
  ): Observable<EliminarHorarioResponse> {
    return this.http.delete<EliminarHorarioResponse>(
      `${this.apiUrl}/usuario/${usuarioId}`
    );
  }
}