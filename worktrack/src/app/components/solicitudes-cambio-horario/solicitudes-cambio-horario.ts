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
import {environment} from '../../../environments/environment';
import {TipoJustificativo} from '../../models/solicitud.model';
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

    this.rolActual =
      (usuario?.role as Role) || null;

    this.cargarSolicitudes();
  }

  // =====================================================
  // PERMISOS
  // =====================================================

  get puedeResolver(): boolean {
    return (
      this.rolActual === 'supervisor' ||
      this.rolActual === 'rrhh'
    );
  }

  // =====================================================
  // DATOS DEL MODAL
  // =====================================================

   get tituloModal(): string {
    const esJustificativo =
      this.solicitudSeleccionada?.tipo ===
      'JUSTIFICATIVO_FALTA';

    const sustantivo =
      esJustificativo
        ? 'justificativo'
        : 'cambio de horario';

    return this.accionSeleccionada === 'APROBADA'
      ? `Aprobar ${sustantivo}`
      : `Rechazar ${sustantivo}`;
  }

  get mensajeModal(): string {
    const solicitud =
      this.solicitudSeleccionada;

    if (!solicitud) {
      return '';
    }

    const usuario =
      `${solicitud.usuario_nombre || ''} ` +
      `${solicitud.usuario_apellido || ''}`;

    const accion =
      this.accionSeleccionada === 'APROBADA'
        ? 'aprobar'
        : 'rechazar';

    return (
      `¿Querés ${accion} la solicitud de ` +
      `${usuario.trim()}?`
    );
  }

  get tipoModal(): TipoModal {
    return this.accionSeleccionada === 'APROBADA'
      ? 'success'
      : 'danger';
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

  // =====================================================
  // CARGAR SOLICITUDES GESTIONABLES
  // =====================================================

  cargarSolicitudes(): void {
    this.cargando = true;
    this.errorCarga = false;

    this.solicitudService
      .getSolicitudesGestionables()
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (solicitudes) => {
          this.solicitudes = [
            ...solicitudes
          ];

          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error(
            'Error cargando solicitudes:',
            error
          );

          this.solicitudes = [];
          this.errorCarga = true;

          this.mostrarToast(
            error.error?.mensaje ||
            'No fue posible cargar las solicitudes.',
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
    const respuesta =
      this.respuesta.trim();

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

  // =====================================================
  // APROBAR O RECHAZAR
  // =====================================================

  confirmarResolucion(): void {
    const solicitud =
      this.solicitudSeleccionada;

    const estado =
      this.accionSeleccionada;

    if (
      !solicitud ||
      !estado ||
      !this.puedeResolver ||
      !this.validarRespuesta()
    ) {
      this.cdr.detectChanges();
      return;
    }

    this.procesando = true;

    this.solicitudService
      .resolveSolicitud(
        solicitud.id,
        {
          estado,
          respuesta:
            this.respuesta.trim() ||
            undefined
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
          this.mostrarModal = false;
          this.solicitudSeleccionada = null;
          this.accionSeleccionada = null;
          this.respuesta = '';
          this.errorRespuesta = '';

          this.mostrarToast(
            resultado.mensaje,
            'success'
          );

          // Recarga para que una solicitud aprobada
          // continúe visible con su nuevo estado.
          this.cargarSolicitudes();
        },
        error: (error) => {
          console.error(
            'Error resolviendo solicitud:',
            error
          );

          this.mostrarToast(
            error.error?.mensaje ||
            'No fue posible resolver la solicitud.',
            'error'
          );

          this.cdr.detectChanges();
        }
      });
  }

  // =====================================================
  // ETIQUETAS
  // =====================================================

  obtenerEtiquetaRol(
    role?: Role
  ): string {
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

  // =====================================================
  // FORMATOS
  // =====================================================

  formatearFecha(
    fecha: string
  ): string {
    if (!fecha) {
      return '-';
    }

    const partes =
      fecha.substring(0, 10).split('-');

    if (partes.length !== 3) {
      return fecha;
    }

    return (
      `${partes[2]}/` +
      `${partes[1]}/` +
      `${partes[0]}`
    );
  }

  formatearFechaHora(
    fechaHora: string | null | undefined
  ): string {
    if (!fechaHora) {
      return '-';
    }

    const valor =
      fechaHora.includes('T')
        ? fechaHora
        : fechaHora.replace(' ', 'T');

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
      return fechaHora;
    }

    return new Intl.DateTimeFormat(
      'es-AR',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
      }
    ).format(fecha);
  }

  formatearHora(
    hora: string
  ): string {
    return hora
      ? hora.substring(0, 5)
      : '--:--';
  }

  obtenerIniciales(
    solicitud: SolicitudCambioHorario
  ): string {
    const nombre =
      solicitud.usuario_nombre || '';

    const apellido =
      solicitud.usuario_apellido || '';

    return (
      nombre.charAt(0).toUpperCase() +
      apellido.charAt(0).toUpperCase()
    ) || '?';
  }
  
  // =====================================================
  // TEXTOS DEL JUSTIFICATIVO
  // =====================================================

  obtenerEtiquetaTipoJustificativo(
    tipo: TipoJustificativo
  ): string {
    switch (tipo) {
      case 'CERTIFICADO_MEDICO':
        return 'Certificado médico';
      case 'EMERGENCIA_FAMILIAR':
        return 'Emergencia familiar';
      default:
        return 'Otro motivo';
    }
  }

  obtenerUrlArchivo(
    archivoUrl: string | null | undefined
  ): string {
    if (!archivoUrl) {
      return '';
    }

    const base =
      environment.apiUrl.replace(
        '/api',
        ''
      );

    return base + archivoUrl;
  }

  // =====================================================
  // TOAST
  // =====================================================

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
    this.cdr.detectChanges();
  }
}