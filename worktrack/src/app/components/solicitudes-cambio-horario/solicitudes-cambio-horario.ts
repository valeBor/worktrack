import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { Modal, TipoModal } from '../modal/modal';
import { Toast, TipoToast } from '../toast/toast';
import {
  SolicitudCambioHorario,
  TipoJustificativo
} from '../../models/solicitud.model';
import { SolicitudService } from '../../services/solicitud.service';
import { AuthService } from '../../services/auth.service';
import { Role } from '../../models/user.models';

type VistaGestion =
  | 'CAMBIO_HORARIO'
  | 'JUSTIFICACION_INASISTENCIA';

@Component({
  selector: 'app-solicitudes-cambio-horario',
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, Toast],
  templateUrl: './solicitudes-cambio-horario.html',
  styleUrl: './solicitudes-cambio-horario.css'
})
export class SolicitudesCambioHorario implements OnInit {
  solicitudes: SolicitudCambioHorario[] = [];
  rolActual: Role | null = null;
  vistaActiva: VistaGestion = 'CAMBIO_HORARIO';

  cargando = false;
  errorCarga = false;

  mostrarModal = false;
  solicitudSeleccionada: SolicitudCambioHorario | null = null;
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
    const usuario = this.authService.getUser();
    this.rolActual = (usuario?.role as Role) || null;
    this.cargarSolicitudes();
  }

  get puedeResolver(): boolean {
    return (
      this.rolActual === 'supervisor' ||
      this.rolActual === 'rrhh'
    );
  }

  get solicitudesVisibles(): SolicitudCambioHorario[] {
    return this.solicitudes.filter(
      solicitud => solicitud.tipo === this.vistaActiva
    );
  }

  get cantidadCambiosHorario(): number {
    return this.solicitudes.filter(
      solicitud => solicitud.tipo === 'CAMBIO_HORARIO'
    ).length;
  }

  get cantidadJustificaciones(): number {
    return this.solicitudes.filter(
      solicitud =>
        solicitud.tipo === 'JUSTIFICACION_INASISTENCIA'
    ).length;
  }

  get tituloSeccion(): string {
    return this.vistaActiva === 'CAMBIO_HORARIO'
      ? 'Cambios de horario'
      : 'Justificaciones de inasistencia';
  }

  get descripcionSeccion(): string {
    if (this.vistaActiva === 'CAMBIO_HORARIO') {
      return this.puedeResolver
        ? 'Consultá y resolvé las solicitudes de cambio de horario.'
        : 'Consultá las solicitudes de cambio de horario registradas.';
    }

    return this.puedeResolver
      ? 'Consultá y resolvé las justificaciones de inasistencia.'
      : 'Consultá las justificaciones de inasistencia registradas.';
  }

  get mensajeListaVacia(): string {
    return this.vistaActiva === 'CAMBIO_HORARIO'
      ? 'No hay solicitudes de cambio de horario registradas.'
      : 'No hay justificaciones de inasistencia registradas.';
  }

  seleccionarVista(vista: VistaGestion): void {
    this.vistaActiva = vista;
  }

  get esJustificacionSeleccionada(): boolean {
    return (
      this.solicitudSeleccionada?.tipo ===
      'JUSTIFICACION_INASISTENCIA'
    );
  }

  get tituloModal(): string {
    const sustantivo = this.esJustificacionSeleccionada
      ? 'justificación de inasistencia'
      : 'cambio de horario';

    return this.accionSeleccionada === 'APROBADA'
      ? `Aprobar ${sustantivo}`
      : `Rechazar ${sustantivo}`;
  }

  get mensajeModal(): string {
    const solicitud = this.solicitudSeleccionada;

    if (!solicitud) return '';

    const usuario = [
      solicitud.usuario_nombre,
      solicitud.usuario_apellido
    ].filter(Boolean).join(' ');

    const accion = this.accionSeleccionada === 'APROBADA'
      ? 'aprobar'
      : 'rechazar';

    const elemento = this.esJustificacionSeleccionada
      ? 'la justificación de inasistencia'
      : 'la solicitud de cambio de horario';

    return `¿Querés ${accion} ${elemento} de ${usuario}?`;
  }

  get tipoModal(): TipoModal {
    return this.accionSeleccionada === 'APROBADA'
      ? 'success'
      : 'danger';
  }

  get textoConfirmarModal(): string {
  const elemento = this.esJustificacionSeleccionada
    ? 'justificación'
    : 'solicitud';

  if (this.procesando) {
    return this.accionSeleccionada === 'APROBADA'
      ? 'Aprobando...'
      : 'Rechazando...';
  }

  return this.accionSeleccionada === 'APROBADA'
    ? `Aprobar ${elemento}`
    : `Rechazar ${elemento}`;
}

  cargarSolicitudes(): void {
    this.cargando = true;
    this.errorCarga = false;

    this.solicitudService.getSolicitudesGestionables()
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: solicitudes => {
          this.solicitudes = solicitudes;
        },
        error: (error: HttpErrorResponse) => {
          this.solicitudes = [];
          this.errorCarga = true;

          this.mostrarToast(
            this.obtenerMensajeError(
              error,
              'No fue posible cargar las solicitudes.'
            ),
            'error'
          );
        }
      });
  }

  abrirModal(
    solicitud: SolicitudCambioHorario,
    accion: 'APROBADA' | 'RECHAZADA'
  ): void {
    if (!this.puedeResolver) return;

    this.solicitudSeleccionada = solicitud;
    this.accionSeleccionada = accion;
    this.respuesta = '';
    this.errorRespuesta = '';
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    if (this.procesando) return;

    this.mostrarModal = false;
    this.solicitudSeleccionada = null;
    this.accionSeleccionada = null;
    this.respuesta = '';
    this.errorRespuesta = '';
  }

  validarRespuesta(): boolean {
    const respuesta = this.respuesta.trim();

    if (
      this.accionSeleccionada === 'RECHAZADA' &&
      respuesta.length < 5
    ) {
      this.errorRespuesta =
        'El motivo del rechazo debe contener al menos 5 caracteres.';
      return false;
    }

    if (respuesta.length > 500) {
      this.errorRespuesta =
        'La respuesta no puede superar los 500 caracteres.';
      return false;
    }

    this.errorRespuesta = '';
    return true;
  }

  confirmarResolucion(): void {
    const solicitud = this.solicitudSeleccionada;
    const estado = this.accionSeleccionada;

    if (
      !solicitud ||
      !estado ||
      !this.puedeResolver ||
      !this.validarRespuesta()
    ) {
      return;
    }

    this.procesando = true;

    this.solicitudService.resolveSolicitud(
      solicitud.id,
      {
        estado,
        respuesta: this.respuesta.trim() || undefined
      }
    )
      .pipe(
        finalize(() => {
          this.procesando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: resultado => {
          this.mostrarModal = false;
          this.solicitudSeleccionada = null;
          this.accionSeleccionada = null;
          this.respuesta = '';
          this.errorRespuesta = '';

          this.mostrarToast(resultado.mensaje, 'success');
          this.cargarSolicitudes();
        },
        error: (error: HttpErrorResponse) => {
          this.mostrarToast(
            this.obtenerMensajeError(
              error,
              'No fue posible resolver la solicitud.'
            ),
            'error'
          );
        }
      });
  }

  verArchivo(solicitud: SolicitudCambioHorario): void {
    this.obtenerArchivo(solicitud, false);
  }

  descargarArchivo(solicitud: SolicitudCambioHorario): void {
    this.obtenerArchivo(solicitud, true);
  }

  private obtenerArchivo(
    solicitud: SolicitudCambioHorario,
    descargar: boolean
  ): void {
    const archivoId = solicitud.archivo_id;

    if (!archivoId) {
      this.mostrarToast(
        'La solicitud no tiene un archivo adjunto.',
        'warning'
      );
      return;
    }

    if (typeof window === 'undefined') return;

    const ventana = descargar
      ? null
      : window.open('', '_blank');

    this.procesandoArchivoId = archivoId;

    this.solicitudService
      .getArchivoJustificativo(archivoId, descargar)
      .pipe(
        finalize(() => {
          this.procesandoArchivoId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: response => {
          this.procesarArchivo(
            response,
            solicitud,
            descargar,
            ventana
          );
        },
        error: (error: HttpErrorResponse) => {
          ventana?.close();

          this.mostrarToast(
            this.obtenerMensajeErrorBlob(
              error,
              'No fue posible obtener el archivo.'
            ),
            'error'
          );
        }
      });
  }

  private procesarArchivo(
    response: HttpResponse<Blob>,
    solicitud: SolicitudCambioHorario,
    descargar: boolean,
    ventana: Window | null
  ): void {
    if (!response.body) {
      ventana?.close();
      this.mostrarToast(
        'El servidor no devolvió el archivo.',
        'error'
      );
      return;
    }

    const url = URL.createObjectURL(response.body);
    const nombre = this.obtenerNombreArchivo(
      response,
      solicitud.archivo_nombre_original ||
      `justificativo-${solicitud.id}`
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

    window.setTimeout(
      () => URL.revokeObjectURL(url),
      60000
    );
  }

  private obtenerNombreArchivo(
    response: HttpResponse<Blob>,
    nombrePredeterminado: string
  ): string {
    const disposition =
      response.headers.get('Content-Disposition') || '';

    const utf8 = disposition.match(
      /filename\*=UTF-8''([^;]+)/
    );

    if (utf8?.[1]) {
      try {
        return decodeURIComponent(utf8[1]);
      } catch {
        return nombrePredeterminado;
      }
    }

    const simple = disposition.match(
      /filename="?([^";]+)"?/
    );

    return simple?.[1] || nombrePredeterminado;
  }

  obtenerEtiquetaRol(role?: Role): string {
    switch (role) {
      case 'supervisor':
        return 'Supervisor';
      case 'empleado':
        return 'Empleado';
      case 'rrhh':
        return 'Recursos Humanos';
      case 'admin':
        return 'Administrador';
      default:
        return 'Sin rol';
    }
  }

  obtenerEtiquetaEstado(
    estado: SolicitudCambioHorario['estado']
  ): string {
    switch (estado) {
      case 'APROBADA':
        return 'Aprobada';
      case 'RECHAZADA':
        return 'Rechazada';
      default:
        return 'Pendiente';
    }
  }

  obtenerIconoEstado(
    estado: SolicitudCambioHorario['estado']
  ): string {
    switch (estado) {
      case 'APROBADA':
        return 'bi-check-circle';
      case 'RECHAZADA':
        return 'bi-x-circle';
      default:
        return 'bi-clock';
    }
  }

  obtenerEtiquetaTipoJustificativo(
    tipo: TipoJustificativo | null | undefined
  ): string {
    switch (tipo) {
      case 'CERTIFICADO_MEDICO':
        return 'Certificado médico';
      case 'CERTIFICADO_ESTUDIO':
        return 'Certificado de estudio';
      case 'EMERGENCIA_FAMILIAR':
        return 'Emergencia familiar';
      case 'OTRO':
        return 'Otro motivo';
      default:
        return 'Sin especificar';
    }
  }

  formatearFecha(
    fecha: string | null | undefined
  ): string {
    if (!fecha) return '-';

    const partes = fecha.substring(0, 10).split('-');

    if (partes.length !== 3) return fecha;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  formatearFechaHora(
    fechaHora: string | null | undefined
  ): string {
    if (!fechaHora) return '-';

    const valor = fechaHora.includes('T')
      ? fechaHora
      : fechaHora.replace(' ', 'T');

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
      return fechaHora;
    }

    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).format(fecha);
  }

  formatearHora(
    hora: string | null | undefined
  ): string {
    return hora ? hora.substring(0, 5) : '--:--';
  }

  formatearTamanio(
    bytes: number | null | undefined
  ): string {
    if (!bytes) return '';

    if (bytes < 1024 * 1024) {
      return `${Math.ceil(bytes / 1024)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  obtenerIniciales(
    solicitud: SolicitudCambioHorario
  ): string {
    const nombre = solicitud.usuario_nombre || '';
    const apellido = solicitud.usuario_apellido || '';

    return (
      nombre.charAt(0).toUpperCase() +
      apellido.charAt(0).toUpperCase()
    ) || '?';
  }

  private obtenerMensajeError(
    error: HttpErrorResponse,
    predeterminado: string
  ): string {
    return (
      error.error?.mensaje ||
      error.error?.message ||
      predeterminado
    );
  }

  private obtenerMensajeErrorBlob(
    error: HttpErrorResponse,
    predeterminado: string
  ): string {
    if (!(error.error instanceof Blob)) {
      return this.obtenerMensajeError(error, predeterminado);
    }

    return predeterminado;
  }

  mostrarToast(
    mensaje: string,
    tipo: TipoToast
  ): void {
    this.toastMensaje = mensaje;
    this.toastTipo = tipo;
    this.toastVisible = true;
  }

  cerrarToast(): void {
    this.toastVisible = false;
  }
}