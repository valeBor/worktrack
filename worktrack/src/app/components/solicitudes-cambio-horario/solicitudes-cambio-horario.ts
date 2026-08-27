import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {finalize} from 'rxjs/operators';
import {Modal, TipoModal} from '../modal/modal';
import {Toast, TipoToast} from '../toast/toast';
import {SolicitudCambioHorario} from '../../models/solicitud.model';
import {SolicitudService} from '../../services/solicitud.service';
import {AuthService} from '../../services/auth.service';
import {Role} from '../../models/user.models';

@Component({
  selector: 'app-solicitudes-cambio-horario',
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, Toast],
  templateUrl: './solicitudes-cambio-horario.html',
  styleUrl: './solicitudes-cambio-horario.css'
})
export class SolicitudesCambioHorario implements OnInit {
  solicitudes: SolicitudCambioHorario[] = [];
  cargando = false;
  errorCarga = false;
  rolActual: Role | null = null;

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
    private solicitudService: SolicitudService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  // =====================================================
  // INICIALIZACIÓN
  // =====================================================

  ngOnInit(): void {
    const usuario = this.authService.getUser();
    this.rolActual = (usuario?.role as Role) || null;
    this.cargarSolicitudes();
  }

  // =====================================================
  // PERMISOS
  // =====================================================

  get puedeResolver(): boolean {
    return this.rolActual === 'supervisor' || this.rolActual === 'rrhh';
  }

  // =====================================================
  // DATOS DEL MODAL
  // =====================================================

  get tituloModal(): string {
    return this.accionSeleccionada === 'APROBADA'
      ? 'Aprobar cambio de horario'
      : 'Rechazar cambio de horario';
  }

  get mensajeModal(): string {
    const solicitud = this.solicitudSeleccionada;

    if (!solicitud) {
      return '';
    }

    const empleado = `${solicitud.usuario_nombre || ''} ${solicitud.usuario_apellido || ''}`.trim();
    const accion = this.accionSeleccionada === 'APROBADA' ? 'aprobar' : 'rechazar';

    return `¿Querés ${accion} la solicitud de ${empleado}?`;
  }

  get tipoModal(): TipoModal {
    return this.accionSeleccionada === 'APROBADA' ? 'success' : 'danger';
  }

  get textoConfirmarModal(): string {
    if (this.procesando) {
      return this.accionSeleccionada === 'APROBADA' ? 'Aprobando...' : 'Rechazando...';
    }

    return this.accionSeleccionada === 'APROBADA'
      ? 'Aprobar solicitud'
      : 'Rechazar solicitud';
  }

  // =====================================================
  // CARGAR PENDIENTES
  // =====================================================

  cargarSolicitudes(): void {
    this.cargando = true;
    this.errorCarga = false;

    this.solicitudService.getSolicitudesPendientes()
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (solicitudes) => {
          this.solicitudes = [...solicitudes];
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error cargando solicitudes:', error);
          this.solicitudes = [];
          this.errorCarga = true;
          this.mostrarToast(
            error.error?.mensaje || 'No fue posible cargar las solicitudes pendientes.',
            'error'
          );
          this.cdr.detectChanges();
        }
      });
  }

  // =====================================================
  // ABRIR MODAL
  // =====================================================

  abrirModal(
    solicitud: SolicitudCambioHorario,
    accion: 'APROBADA' | 'RECHAZADA'
  ): void {
    if (!this.puedeResolver) {
      return;
    }

    this.solicitudSeleccionada = solicitud;
    this.accionSeleccionada = accion;
    this.respuesta = '';
    this.errorRespuesta = '';
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  // =====================================================
  // CERRAR MODAL
  // =====================================================

  cerrarModal(): void {
    if (this.procesando) {
      return;
    }

    this.mostrarModal = false;
    this.solicitudSeleccionada = null;
    this.accionSeleccionada = null;
    this.respuesta = '';
    this.errorRespuesta = '';
    this.cdr.detectChanges();
  }

  // =====================================================
  // VALIDAR RESPUESTA
  // =====================================================

  validarRespuesta(): boolean {
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

  // =====================================================
  // APROBAR O RECHAZAR
  // =====================================================

  confirmarResolucion(): void {
    const solicitud = this.solicitudSeleccionada;
    const estado = this.accionSeleccionada;

    if (!solicitud || !estado || !this.puedeResolver || !this.validarRespuesta()) {
      this.cdr.detectChanges();
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
        next: (resultado) => {
          this.solicitudes = this.solicitudes.filter(
            (item) => item.id !== solicitud.id
          );

          this.mostrarModal = false;
          this.solicitudSeleccionada = null;
          this.accionSeleccionada = null;
          this.respuesta = '';
          this.errorRespuesta = '';

          this.mostrarToast(resultado.mensaje, 'success');
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error resolviendo solicitud:', error);
          this.mostrarToast(
            error.error?.mensaje || 'No fue posible resolver la solicitud.',
            'error'
          );
          this.cdr.detectChanges();
        }
      });
  }

  // =====================================================
  // FORMATOS
  // =====================================================

  formatearFecha(fecha: string): string {
    if (!fecha) {
      return '-';
    }

    const partes = fecha.substring(0, 10).split('-');

    if (partes.length !== 3) {
      return fecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  formatearFechaHora(fechaHora: string): string {
    if (!fechaHora) {
      return '-';
    }

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

  formatearHora(hora: string): string {
    return hora ? hora.substring(0, 5) : '--:--';
  }

  obtenerIniciales(solicitud: SolicitudCambioHorario): string {
    const nombre = solicitud.usuario_nombre || '';
    const apellido = solicitud.usuario_apellido || '';

    return (
      nombre.charAt(0).toUpperCase() +
      apellido.charAt(0).toUpperCase()
    ) || '?';
  }

  // =====================================================
  // TOAST
  // =====================================================

  mostrarToast(mensaje: string, tipo: TipoToast): void {
    this.toastMensaje = mensaje;
    this.toastTipo = tipo;
    this.toastVisible = true;
  }

  cerrarToast(): void {
    this.toastVisible = false;
    this.cdr.detectChanges();
  }
}