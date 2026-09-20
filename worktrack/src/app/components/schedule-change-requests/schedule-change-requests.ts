import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { Modal, TipoModal } from '../modal/modal';
import { Toast, TipoToast } from '../toast/toast';
import { SolicitudCambioHorario } from '../../models/solicitud.model';
import { Role } from '../../models/user.models';
import { SolicitudService } from '../../services/solicitud.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-schedule-change-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, Toast],
  templateUrl: './schedule-change-requests.html',
  styleUrl: './schedule-change-requests.css'
})
export class ScheduleChangeRequests implements OnInit {
  solicitudes: SolicitudCambioHorario[] = [];
  rolActual: Role | null = null;
  cargando = false;
  errorCarga = false;
  mostrarModal = false;
  solicitudSeleccionada: SolicitudCambioHorario | null = null;
  accionSeleccionada: 'APROBADA' | 'RECHAZADA' | null = null;
  respuesta = '';
  procesando = false;
  errorRespuesta = '';
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
    this.cargarSolicitudes();
  }

  get puedeResolver(): boolean {
    return this.rolActual === 'supervisor' || this.rolActual === 'rrhh';
  }

  get tituloModal(): string {
    return this.accionSeleccionada === 'APROBADA'
      ? 'Aprobar cambio de horario'
      : 'Rechazar cambio de horario';
  }

  get mensajeModal(): string {
    if (!this.solicitudSeleccionada) return '';

    const nombre = [
      this.solicitudSeleccionada.usuario_nombre,
      this.solicitudSeleccionada.usuario_apellido
    ].filter(Boolean).join(' ');
    const accion = this.accionSeleccionada === 'APROBADA'
      ? 'aprobar'
      : 'rechazar';

    return `¿Querés ${accion} la solicitud de cambio de horario de ${nombre}?`;
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
      ? 'Aprobar solicitud'
      : 'Rechazar solicitud';
  }

  cargarSolicitudes(): void {
    this.cargando = true;
    this.errorCarga = false;

    this.solicitudService.getSolicitudesGestionables()
      .pipe(finalize(() => {
        this.cargando = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: solicitudes => {
          this.solicitudes = solicitudes.filter(
            solicitud => solicitud.tipo === 'CAMBIO_HORARIO'
          );
        },
        error: (error: HttpErrorResponse) => {
          this.solicitudes = [];
          this.errorCarga = true;
          this.mostrarToast(
            this.obtenerMensajeError(error, 'No fue posible cargar las solicitudes.'),
            'error'
          );
        }
      });
  }

  abrirModal(
    solicitud: SolicitudCambioHorario,
    accion: 'APROBADA' | 'RECHAZADA'
  ): void {
    if (!this.puedeResolver || solicitud.estado !== 'PENDIENTE') return;

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

  confirmarResolucion(): void {
    const solicitud = this.solicitudSeleccionada;
    const estado = this.accionSeleccionada;

    if (!solicitud || !estado || !this.puedeResolver || !this.validarRespuesta()) {
      return;
    }

    this.procesando = true;
    this.solicitudService.resolveSolicitud(solicitud.id, {
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
          this.solicitudSeleccionada = null;
          this.accionSeleccionada = null;
          this.respuesta = '';
          this.errorRespuesta = '';

          this.mostrarToast(resultado.mensaje, 'success');
          this.cargarSolicitudes();
        },
        error: (error: HttpErrorResponse) => {
          this.mostrarToast(
            this.obtenerMensajeError(error, 'No fue posible resolver la solicitud.'),
            'error'
          );
        }
      });
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

  formatearHora(hora?: string | null): string {
    return hora ? hora.substring(0, 5) : '--:--';
  }

  obtenerIniciales(solicitud: SolicitudCambioHorario): string {
    const nombre = solicitud.usuario_nombre || '';
    const apellido = solicitud.usuario_apellido || '';
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

  private obtenerMensajeError(
    error: HttpErrorResponse,
    predeterminado: string
  ): string {
    return error.error?.mensaje || error.error?.message || predeterminado;
  }

  private mostrarToast(mensaje: string, tipo: TipoToast): void {
    this.toastMensaje = mensaje;
    this.toastTipo = tipo;
    this.toastVisible = true;
  }
}
