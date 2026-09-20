import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators} from '@angular/forms';
import {HttpErrorResponse} from '@angular/common/http';
import {finalize} from 'rxjs/operators';
import {Toast, TipoToast} from '../toast/toast';
import {SolicitudService} from '../../services/solicitud.service';
import {AuthService} from '../../services/auth.service';
import {GrupoSolicitudes, HorarioActualFecha, NuevaSolicitudCambioHorario, SolicitudCambioHorario, SolicitudEstado} from '../../models/solicitud.model';
import {Role} from '../../models/user.models';

@Component({
  selector: 'app-schedule-change',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Toast],
  templateUrl: './schedule-change.html',
  styleUrl: './schedule-change.css'
})
export class ScheduleChange implements OnInit {
  solicitudes: SolicitudCambioHorario[] = [];
  rolActual: Role | null = null;
  solicitudForm: FormGroup;
  fechaMinima: string;
  mostrarFormulario = false;
  formularioEnviado = false;
  guardando = false;
  consultandoHorario = false;
  horarioActual: HorarioActualFecha | null = null;
  errorHorario = '';
  cargando = false;
  errorCarga = false;
  toastVisible = false;
  toastMensaje = '';
  toastTipo: TipoToast = 'info';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly solicitudService: SolicitudService,
    private readonly authService: AuthService,
    private readonly changeDetector: ChangeDetectorRef
  ) {
    this.fechaMinima = this.obtenerFechaManana();

    this.solicitudForm = this.formBuilder.group(
      {
        fecha_solicitada: [
          '',
          [
            Validators.required,
            this.validarFechaFutura.bind(this)
          ]
        ],
        hora_entrada_solicitada: [
          '',
          [
            Validators.required,
            Validators.pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
          ]
        ],
        hora_salida_solicitada: [
          '',
          [
            Validators.required,
            Validators.pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
          ]
        ],
        modalidad_solicitada: ['', Validators.required],
        motivo: [
          '',
          [
            Validators.required,
            Validators.minLength(5),
            Validators.maxLength(500)
          ]
        ]
      },
      {validators: this.validarRangoHorario}
    );
  }

  ngOnInit(): void {
    this.rolActual = this.authService.getRole() as Role | null;
    this.cargarSolicitudes();
  }

  get textoAprobacion(): string {
    return this.rolActual === 'supervisor'
      ? 'El cambio debe ser aprobado por Recursos Humanos.'
      : 'El cambio debe ser aprobado por un supervisor o por Recursos Humanos.';
  }

  get gruposSolicitudes(): GrupoSolicitudes[] {
    return [
      {
        estado: 'PENDIENTE',
        titulo: 'Solicitudes pendientes',
        icono: 'bi-clock',
        solicitudes: this.filtrarSolicitudes('PENDIENTE')
      },
      {
        estado: 'APROBADA',
        titulo: 'Solicitudes aprobadas',
        icono: 'bi-check-circle',
        solicitudes: this.filtrarSolicitudes('APROBADA')
      },
      {
        estado: 'RECHAZADA',
        titulo: 'Solicitudes rechazadas',
        icono: 'bi-x-circle',
        solicitudes: this.filtrarSolicitudes('RECHAZADA')
      }
    ];
  }

  private filtrarSolicitudes(
    estado: SolicitudEstado
  ): SolicitudCambioHorario[] {
    return this.solicitudes.filter(
      solicitud =>
        solicitud.estado === estado &&
        solicitud.tipo === 'CAMBIO_HORARIO'
    );
  }

  cargarSolicitudes(): void {
    this.cargando = true;
    this.errorCarga = false;

    this.solicitudService.getMisSolicitudes()
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.changeDetector.detectChanges();
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

  nuevaSolicitud(): void {
    this.limpiarFormulario();
    this.guardando = false;
    this.mostrarFormulario = true;
  }

  cancelarFormulario(): void {
    if (this.guardando) return;

    this.limpiarFormulario();
    this.mostrarFormulario = false;
  }

  private limpiarFormulario(): void {
    this.solicitudForm.reset();
    this.formularioEnviado = false;
    this.consultandoHorario = false;
    this.horarioActual = null;
    this.errorHorario = '';
  }

  consultarHorario(): void {
    this.horarioActual = null;
    this.errorHorario = '';
    this.solicitudForm.get('modalidad_solicitada')?.reset();

    const controlFecha = this.solicitudForm.get('fecha_solicitada');
    controlFecha?.markAsTouched();

    if (!controlFecha || controlFecha.invalid) return;

    const fecha = String(controlFecha.value || '');
    this.consultandoHorario = true;

    this.solicitudService.getMiHorarioParaFecha(fecha)
      .pipe(
        finalize(() => {
          this.consultandoHorario = false;
          this.changeDetector.detectChanges();
        })
      )
      .subscribe({
        next: horario => {
          this.horarioActual = horario;
          this.solicitudForm.patchValue({
            modalidad_solicitada:
              horario.horario_actual.modalidad
          });
        },
        error: (error: HttpErrorResponse) => {
          this.horarioActual = null;
          this.errorHorario = this.obtenerMensajeError(
            error,
            'No fue posible obtener el horario de la fecha seleccionada.'
          );
        }
      });
  }

  guardarSolicitud(): void {
    this.formularioEnviado = true;
    this.solicitudForm.markAllAsTouched();

    if (this.solicitudForm.invalid) {
      this.mostrarToast(
        'Revisá los campos marcados en el formulario.',
        'warning'
      );
      return;
    }

    if (!this.horarioActual) {
      this.mostrarToast(
        'Primero seleccioná una fecha con un horario asignado.',
        'warning'
      );
      return;
    }

    const valores = this.solicitudForm.getRawValue();

    if (
      this.horarioActual.fecha_solicitada !==
      valores.fecha_solicitada
    ) {
      this.horarioActual = null;
      this.mostrarToast(
        'La fecha cambió. Volvé a consultar el horario actual.',
        'warning'
      );
      return;
    }

    const solicitud: NuevaSolicitudCambioHorario = {
      fecha_solicitada: valores.fecha_solicitada,
      hora_entrada_solicitada:
        valores.hora_entrada_solicitada,
      hora_salida_solicitada:
        valores.hora_salida_solicitada,
      modalidad_solicitada:
        valores.modalidad_solicitada,
      motivo: String(valores.motivo || '').trim()
    };

    this.guardando = true;

    this.solicitudService.createSolicitud(solicitud)
      .pipe(
        finalize(() => {
          this.guardando = false;
          this.changeDetector.detectChanges();
        })
      )
      .subscribe({
        next: respuesta => {
          this.mostrarFormulario = false;
          this.limpiarFormulario();
          this.mostrarToast(respuesta.mensaje, 'success');
          this.cargarSolicitudes();
        },
        error: (error: HttpErrorResponse) => {
          this.mostrarToast(
            this.obtenerMensajeError(
              error,
              'No fue posible enviar la solicitud.'
            ),
            'error'
          );
        }
      });
  }

  validarFechaFutura(
    control: AbstractControl
  ): ValidationErrors | null {
    const fecha = String(control.value || '');

    if (!fecha) return null;

    return fecha < this.fechaMinima
      ? {fechaNoFutura: true}
      : null;
  }

  validarRangoHorario(
    control: AbstractControl
  ): ValidationErrors | null {
    const entrada = String(
      control.get('hora_entrada_solicitada')?.value || ''
    );
    const salida = String(
      control.get('hora_salida_solicitada')?.value || ''
    );

    if (!entrada || !salida) return null;

    return entrada >= salida
      ? {rangoHorarioInvalido: true}
      : null;
  }

  campoInvalido(nombreCampo: string): boolean {
    const control = this.solicitudForm.get(nombreCampo);

    return Boolean(
      control &&
      control.invalid &&
      (control.touched || this.formularioEnviado)
    );
  }

  tieneError(nombreCampo: string, error: string): boolean {
    return Boolean(
      this.solicitudForm.get(nombreCampo)?.hasError(error)
    );
  }

  rangoHorarioInvalido(): boolean {
    return Boolean(
      this.solicitudForm.hasError('rangoHorarioInvalido') &&
      (
        this.formularioEnviado ||
        this.solicitudForm
          .get('hora_salida_solicitada')
          ?.touched
      )
    );
  }

  private obtenerFechaManana(): string {
    const hoy = this.obtenerFechaArgentina();
    const [anio, mes, dia] = hoy.split('-').map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia + 1));

    return [
      fecha.getUTCFullYear(),
      String(fecha.getUTCMonth() + 1).padStart(2, '0'),
      String(fecha.getUTCDate()).padStart(2, '0')
    ].join('-');
  }

  private obtenerFechaArgentina(): string {
    const partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date());
    const valor = (tipo: string) =>
      partes.find(parte => parte.type === tipo)?.value || '';

    return `${valor('year')}-${valor('month')}-${valor('day')}`;
  }

  formatearFecha(fecha: string | null): string {
    if (!fecha) return '-';

    const partes = fecha.substring(0, 10).split('-');
    if (partes.length !== 3) return fecha;

    const [anio, mes, dia] = partes;
    return `${dia}/${mes}/${anio}`;
  }

  formatearFechaHora(fechaHora: string | null): string {
    if (!fechaHora) return '-';

    const normalizada = fechaHora.includes('T')
      ? fechaHora
      : fechaHora.replace(' ', 'T');
    const fecha = new Date(normalizada);

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

  formatearHora(hora: string | null): string {
    return hora ? hora.substring(0, 5) : '--:--';
  }

  obtenerTituloEstado(estado: SolicitudEstado): string {
    if (estado === 'APROBADA') return 'Solicitud aprobada';
    if (estado === 'RECHAZADA') return 'Solicitud rechazada';
    return 'En revisión';
  }

  obtenerEtiquetaEstado(estado: SolicitudEstado): string {
    if (estado === 'APROBADA') return 'Aprobada';
    if (estado === 'RECHAZADA') return 'Rechazada';
    return 'Pendiente';
  }

  obtenerIconoEstado(estado: SolicitudEstado): string {
    if (estado === 'APROBADA') return 'bi-check-lg';
    if (estado === 'RECHAZADA') return 'bi-x-lg';
    return 'bi-clock';
  }

  private obtenerMensajeError(
    error: HttpErrorResponse,
    mensajePredeterminado: string
  ): string {
    return error.error?.mensaje ||
      error.error?.message ||
      mensajePredeterminado;
  }

  mostrarToast(mensaje: string, tipo: TipoToast): void {
    this.toastMensaje = mensaje;
    this.toastTipo = tipo;
    this.toastVisible = true;
  }

  cerrarToast(): void {
    this.toastVisible = false;
  }
}
