import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams, HttpResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {
  CrearJustificativoResponse,
  CrearSolicitudResponse,
  HorarioActualFecha,
  NuevaSolicitudCambioHorario,
  NuevaSolicitudJustificativo,
  ResolverSolicitudRequest,
  ResolverSolicitudResponse,
  SolicitudCambioHorario
} from '../models/solicitud.model';

@Injectable({providedIn: 'root'})
export class SolicitudService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/solicitudes`;

  getMisSolicitudes(): Observable<SolicitudCambioHorario[]> {
    return this.http.get<SolicitudCambioHorario[]>(
      `${this.apiUrl}/mias`
    );
  }

  getMiHorarioParaFecha(fecha: string): Observable<HorarioActualFecha> {
    const params = new HttpParams().set('fecha', fecha);

    return this.http.get<HorarioActualFecha>(
      `${this.apiUrl}/horario-fecha`,
      {params}
    );
  }

  createSolicitud(
    solicitud: NuevaSolicitudCambioHorario
  ): Observable<CrearSolicitudResponse> {
    return this.http.post<CrearSolicitudResponse>(
      this.apiUrl,
      solicitud
    );
  }

  getSolicitudesPendientes(): Observable<SolicitudCambioHorario[]> {
    return this.http.get<SolicitudCambioHorario[]>(
      `${this.apiUrl}/pendientes`
    );
  }

  getSolicitudesGestionables(): Observable<SolicitudCambioHorario[]> {
    return this.http.get<SolicitudCambioHorario[]>(
      `${this.apiUrl}/gestionables`
    );
  }

  resolveSolicitud(
    solicitudId: number,
    datos: ResolverSolicitudRequest
  ): Observable<ResolverSolicitudResponse> {
    return this.http.patch<ResolverSolicitudResponse>(
      `${this.apiUrl}/${solicitudId}/resolver`,
      datos
    );
  }

  createJustificativo(
    datos: NuevaSolicitudJustificativo,
    archivo: File | null
  ): Observable<CrearJustificativoResponse> {
    const formData = new FormData();

    formData.append(
      'fecha_inasistencia',
      datos.fecha_inasistencia
    );

    formData.append(
      'tipo_justificativo',
      datos.tipo_justificativo
    );

    formData.append(
      'motivo',
      datos.motivo
    );

    if (archivo) {
      formData.append(
        'archivo',
        archivo,
        archivo.name
      );
    }

    return this.http.post<CrearJustificativoResponse>(
      `${this.apiUrl}/justificativos`,
      formData
    );
  }

  getArchivoJustificativo(
    archivoId: number,
    descargar = false
  ): Observable<HttpResponse<Blob>> {
    const params = new HttpParams().set(
      'descargar',
      String(descargar)
    );

    return this.http.get(
      `${this.apiUrl}/archivos/${archivoId}`,
      {
        params,
        observe: 'response',
        responseType: 'blob'
      }
    );
  }
}