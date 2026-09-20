import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { Modal, TipoModal } from '../modal/modal';
import { Toast, TipoToast } from '../toast/toast';
import { SolicitudCambioHorario, TipoJustificativo } from '../../models/solicitud.model';
import { Role } from '../../models/user.models';
import { SolicitudService } from '../../services/solicitud.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-absence-justification-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, Toast],
  templateUrl: './absence-justification-requests.html',
  styleUrl: './absence-justification-requests.css'
})
export class AbsenceJustificationRequests implements OnInit {
  justificaciones: SolicitudCambioHorario[] = [];
  rolActual: Role | null = null;
  cargando = false;
  errorCarga = false;
  mostrarModal = false;
  justificacionSeleccionada: SolicitudCambioHorario | null = null;
  accionSeleccionada: 'APROBADA' | 'RECHAZADA' | null = null;
  respuesta = '';
  procesando = false;
  errorRespuesta = '';
  procesandoArchivoId: number | null = null;
  toastVisible = false;
  toastMensaje = '';
  toastTipo: TipoToast = 'info';

  constructor(
    private readonly solicitudService: SolicitudService,
    private readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.rolActual = (this.authService.getUser()?.role as Role) || null;
    this.cargarJustificaciones();
  }

  get puedeResolver(): boolean {
    return this.rolActual === 'supervisor' || this.rolActual === 'rrhh';
  }

  get tituloModal(): string {
    return this.accionSeleccionada === 'APROBADA'
      ? 'Aprobar justificación de inasistencia'
      : 'Rechazar justificación de inasistencia';
  }

  get mensajeModal(): string {
    if (!this.justificacionSeleccionada) return '';

    const nombre = [
      this.justificacionSeleccionada.usuario_nombre,
      this.justificacionSeleccionada.usuario_apellido
    ].filter(Boolean).join(' ');
    const accion = this.accionSeleccionada === 'APROBADA'
      ? 'aprobar'
      : 'rechazar';

    return `¿Querés ${accion} la justificación de inasistencia de ${nombre}?`;
  }

  get tipoModal(): TipoModal {
    return this.accionSeleccionada === 'APROBADA' ? 'success' : 'danger';
  }

  get textoConfirmarModal(): string {
    if (this.procesando) {
      return this.accionSeleccionada === 'APROBADA'
        ? 'Aprobando...'
        : 'Rechazando...';
    }

    return this.accionSeleccionada === 'APROBADA'
      ? 'Aprobar justificación'
      : 'Rechazar justificación';
  }

  cargarJustificaciones(): void {
    this.cargando = true;
    this.errorCarga = false;

    this.solicitudService.getSolicitudesGestionables()
      .pipe(finalize(() => {
        this.cargando = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: solicitudes => {
          this.justificaciones = solicitudes.filter(
            solicitud => solicitud.tipo === 'JUSTIFICACION_INASISTENCIA'
          );
        },
        error: (error: HttpErrorResponse) => {
          this.justificaciones = [];
          this.errorCarga = true;
          this.mostrarToast(
            this.obtenerMensajeError(error, 'No fue posible cargar las justificaciones.'),
            'error'
          );
        }
      });
  }

  abrirModal(
    justificacion: SolicitudCambioHorario,
    accion: 'APROBADA' | 'RECHAZADA'
  ): void {
    if (!this.puedeResolver || justificacion.estado !== 'PENDIENTE') return;

    this.justificacionSeleccionada = justificacion;
    this.accionSeleccionada = accion;
    this.respuesta = '';
    this.errorRespuesta = '';
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    if (this.procesando) return;

    this.mostrarModal = false;
    this.justificacionSeleccionada = null;
    this.accionSeleccionada = null;
    this.respuesta = '';
    this.errorRespuesta = '';
  }

  confirmarResolucion(): void {
    const justificacion = this.justificacionSeleccionada;
    const estado = this.accionSeleccionada;

    if (!justificacion || !estado || !this.puedeResolver || !this.validarRespuesta()) {
      return;
    }

    this.procesando = true;
    this.solicitudService.resolveSolicitud(justificacion.id, {
      estado,
      respuesta: this.respuesta.trim() || undefined
    })
      .pipe(finalize(() => {
        this.procesando = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: resultado => {
          this.mostrarModal = false;
          this.justificacionSeleccionada = null;
          this.accionSeleccionada = null;
          this.respuesta = '';
          this.errorRespuesta = '';

          this.mostrarToast(resultado.mensaje, 'success');
          this.cargarJustificaciones();
        },
        error: (error: HttpErrorResponse) => {
          this.mostrarToast(
            this.obtenerMensajeError(error, 'No fue posible resolver la justificación.'),
            'error'
          );
        }
      });
  }

  verArchivo(justificacion: SolicitudCambioHorario): void {
    this.obtenerArchivo(justificacion, false);
  }

  descargarArchivo(justificacion: SolicitudCambioHorario): void {
    this.obtenerArchivo(justificacion, true);
  }

  obtenerEtiquetaRol(role?: Role): string {
    const etiquetas: Partial<Record<Role, string>> = {
      supervisor: 'Supervisor',
      empleado: 'Empleado',
      rrhh: 'Recursos Humanos',
      admin: 'Administrador'
    };
    return role ? etiquetas[role] || 'Sin rol' : 'Sin rol';
  }

  obtenerEtiquetaEstado(estado: SolicitudCambioHorario['estado']): string {
    if (estado === 'APROBADA') return 'Aprobada';
    if (estado === 'RECHAZADA') return 'Rechazada';
    return 'Pendiente';
  }

  obtenerIconoEstado(estado: SolicitudCambioHorario['estado']): string {
    if (estado === 'APROBADA') return 'bi-check-circle';
    if (estado === 'RECHAZADA') return 'bi-x-circle';
    return 'bi-clock';
  }

  obtenerEtiquetaTipoJustificativo(tipo?: TipoJustificativo | null): string {
    const etiquetas: Partial<Record<TipoJustificativo, string>> = {
      CERTIFICADO_MEDICO: 'Certificado médico',
      CERTIFICADO_ESTUDIO: 'Certificado de estudio',
      EMERGENCIA_FAMILIAR: 'Emergencia familiar',
      OTRO: 'Otro motivo'
    };
    return tipo ? etiquetas[tipo] || 'Sin especificar' : 'Sin especificar';
  }

  formatearFecha(fecha?: string | null): string {
    if (!fecha) return '-';
    const partes = fecha.substring(0, 10).split('-');
    return partes.length === 3
      ? `${partes[2]}/${partes[1]}/${partes[0]}`
      : fecha;
  }

  formatearFechaHora(fechaHora?: string | null): string {
    if (!fechaHora) return '-';
    const fecha = new Date(
      fechaHora.includes('T') ? fechaHora : fechaHora.replace(' ', 'T')
    );
    if (Number.isNaN(fecha.getTime())) return fechaHora;

    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).format(fecha);
  }

  formatearTamanio(bytes?: number | null): string {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  obtenerIniciales(justificacion: SolicitudCambioHorario): string {
    const nombre = justificacion.usuario_nombre || '';
    const apellido = justificacion.usuario_apellido || '';
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase() || '?';
  }

  cerrarToast(): void {
    this.toastVisible = false;
  }

  private validarRespuesta(): boolean {
    const respuesta = this.respuesta.trim();

    if (this.accionSeleccionada === 'RECHAZADA' && respuesta.length < 5) {
      this.errorRespuesta = 'El motivo del rechazo debe contener al menos 5 caracteres.';
      return false;
    }

    if (respuesta.length > 500) {
      this.errorRespuesta = 'La respuesta no puede superar los 500 caracteres.';
      return false;
    }

    this.errorRespuesta = '';
    return true;
  }

  private obtenerArchivo(
    justificacion: SolicitudCambioHorario,
    descargar: boolean
  ): void {
    const archivoId = justificacion.archivo_id;

    if (!archivoId) {
      this.mostrarToast('La justificación no tiene un archivo adjunto.', 'warning');
      return;
    }

    if (typeof window === 'undefined') return;

    const ventana = descargar ? null : window.open('', '_blank');
    this.procesandoArchivoId = archivoId;

    this.solicitudService.getArchivoJustificativo(archivoId, descargar)
      .pipe(finalize(() => {
        this.procesandoArchivoId = null;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: response => this.procesarArchivo(
          response,
          justificacion,
          descargar,
          ventana
        ),
        error: (error: HttpErrorResponse) => {
          ventana?.close();
          this.mostrarToast(
            this.obtenerMensajeErrorBlob(error, 'No fue posible obtener el archivo.'),
            'error'
          );
        }
      });
  }

  private procesarArchivo(
    response: HttpResponse<Blob>,
    justificacion: SolicitudCambioHorario,
    descargar: boolean,
    ventana: Window | null
  ): void {
    if (!response.body) {
      ventana?.close();
      this.mostrarToast('El servidor no devolvió el archivo.', 'error');
      return;
    }

    const url = URL.createObjectURL(response.body);
    const nombre = this.obtenerNombreArchivo(
      response,
      justificacion.archivo_nombre_original || `justificativo-${justificacion.id}`
    );

    if (descargar) {
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = nombre;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
      return;
    }

    if (ventana) {
      ventana.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  private obtenerNombreArchivo(
    response: HttpResponse<Blob>,
    nombrePredeterminado: string
  ): string {
    const disposition = response.headers.get('Content-Disposition') || '';
    const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/);

    if (utf8?.[1]) {
      try {
        return decodeURIComponent(utf8[1]);
      } catch {
        return nombrePredeterminado;
      }
    }

    const simple = disposition.match(/filename="?([^";]+)"?/);
    return simple?.[1] || nombrePredeterminado;
  }

  private obtenerMensajeError(
    error: HttpErrorResponse,
    predeterminado: string
  ): string {
    return error.error?.mensaje || error.error?.message || predeterminado;
  }

  private obtenerMensajeErrorBlob(
    error: HttpErrorResponse,
    predeterminado: string
  ): string {
    return error.error instanceof Blob
      ? predeterminado
      : this.obtenerMensajeError(error, predeterminado);
  }

  private mostrarToast(mensaje: string, tipo: TipoToast): void {
    this.toastMensaje = mensaje;
    this.toastTipo = tipo;
    this.toastVisible = true;
  }
}
