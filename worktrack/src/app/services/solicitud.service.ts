import {Injectable, inject} from '@angular/core';
import {HttpClient,HttpParams} from '@angular/common/http';
import { Observable} from 'rxjs';
import {
  SolicitudCambioHorario,
  NuevaSolicitudCambioHorario,
  HorarioActualFecha,
  CrearSolicitudResponse,
  ResolverSolicitudRequest,
  ResolverSolicitudResponse} from '../models/solicitud.model';


@Injectable({
  providedIn: 'root'
})
export class SolicitudService {

  private http =
    inject(HttpClient);


  private apiUrl =
    'http://localhost:3000/api/solicitudes';


  // ====================================================
  // OBTENER MIS SOLICITUDES
  // ====================================================

  getMisSolicitudes():
    Observable<SolicitudCambioHorario[]> {

    return this.http.get<
      SolicitudCambioHorario[]
    >(
      `${this.apiUrl}/mias`
    );

  }


  // ====================================================
  // OBTENER MI HORARIO PARA UNA FECHA
  // ====================================================

  getMiHorarioParaFecha(
    fecha: string
  ): Observable<HorarioActualFecha> {

    const params =
      new HttpParams().set(
        'fecha',
        fecha
      );


    return this.http.get<
      HorarioActualFecha
    >(
      `${this.apiUrl}/horario-fecha`,
      {
        params
      }
    );

  }


  // ====================================================
  // CREAR SOLICITUD
  // ====================================================

  createSolicitud(
    solicitud:
      NuevaSolicitudCambioHorario
  ): Observable<CrearSolicitudResponse> {

    return this.http.post<
      CrearSolicitudResponse
    >(
      this.apiUrl,
      solicitud
    );

  }


  // ====================================================
  // OBTENER SOLICITUDES PENDIENTES
  // ====================================================

  getSolicitudesPendientes():
    Observable<SolicitudCambioHorario[]> {

    return this.http.get<
      SolicitudCambioHorario[]
    >(
      `${this.apiUrl}/pendientes`
    );

  }


  // ====================================================
  // APROBAR O RECHAZAR SOLICITUD
  // ====================================================

  resolveSolicitud(
    solicitudId: number,
    datos: ResolverSolicitudRequest
  ): Observable<ResolverSolicitudResponse> {

    return this.http.patch<
      ResolverSolicitudResponse
    >(
      `${this.apiUrl}/${solicitudId}/resolver`,
      datos
    );

  }

}