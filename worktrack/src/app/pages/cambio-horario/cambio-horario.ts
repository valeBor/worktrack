import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule,
  ValidationErrors, Validators
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Header } from '../../components/header/header';
import { Toast, TipoToast } from '../../components/toast/toast';
import { SolicitudService } from '../../services/solicitud.service';
import {
  HorarioActualFecha, NuevaSolicitudCambioHorario, SolicitudCambioHorario,
  SolicitudEstado
} from '../../models/solicitud.model';


interface GrupoSolicitudes {
  estado: SolicitudEstado;
  titulo: string;
  icono: string;
  solicitudes: SolicitudCambioHorario[];
}


@Component({
  selector: 'app-cambio-horario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Header, Toast],
  templateUrl: './cambio-horario.html',
  styleUrl: './cambio-horario.css'
})
export class CambioHorario
  implements OnInit {

  solicitudes: SolicitudCambioHorario[] = [];

  cargando = false;
  errorCarga = false;
  // ====================================================
  // FORMULARIO
  // ====================================================

  mostrarFormulario = false;
  solicitudForm: FormGroup;
  formularioEnviado = false;
  guardando = false;
  consultandoHorario = false;
  horarioActual: HorarioActualFecha | null = null;
  errorHorario = '';
  fechaMinima: string;
  // ====================================================
  // TOAST
  // ====================================================

  toastVisible = false;
  toastMensaje = '';
  toastTipo: TipoToast = 'info';

  constructor(
    private formBuilder: FormBuilder,

    private solicitudService: SolicitudService,
    private changeDetector: ChangeDetectorRef

  ) {

    this.fechaMinima =
      this.obtenerFechaManana();


    this.solicitudForm =
      this.formBuilder.group(
        {
          fecha_solicitada: [
            '',
            [
              Validators.required,
              this.validarFechaFutura
                .bind(this)
            ]
          ],

          hora_entrada_solicitada: [
            '',
            [
              Validators.required,
              Validators.pattern(
                /^([01]\d|2[0-3]):[0-5]\d$/
              )
            ]
          ],

          hora_salida_solicitada: [
            '',
            [
              Validators.required,
              Validators.pattern(
                /^([01]\d|2[0-3]):[0-5]\d$/
              )
            ]
          ],

          motivo: [
            '',
            [
              Validators.required,
              Validators.minLength(5),
              Validators.maxLength(500)
            ]
          ]
        },
        {
          validators:
            this.validarRangoHorario
        }
      );

  }


  // ====================================================
  // INICIALIZACIÓN
  // ====================================================

  ngOnInit(): void {

    this.cargarSolicitudes();

  }


  // ====================================================
  // GRUPOS POR ESTADO
  // ====================================================

  get gruposSolicitudes():
    GrupoSolicitudes[] {

    return [
      {
        estado:
          'PENDIENTE',

        titulo:
          'Solicitudes pendientes',

        icono:
          'bi-clock',

        solicitudes:
          this.solicitudes.filter(
            (solicitud) =>
              solicitud.estado
              ===
              'PENDIENTE'
          )
      },
      {
        estado:
          'APROBADA',

        titulo:
          'Solicitudes aprobadas',

        icono:
          'bi-check-circle',

        solicitudes:
          this.solicitudes.filter(
            (solicitud) =>
              solicitud.estado
              ===
              'APROBADA'
          )
      },
      {
        estado:
          'RECHAZADA',

        titulo:
          'Solicitudes rechazadas',

        icono:
          'bi-x-circle',

        solicitudes:
          this.solicitudes.filter(
            (solicitud) =>
              solicitud.estado
              ===
              'RECHAZADA'
          )
      }
    ];

  }


  // ====================================================
  // CARGAR SOLICITUDES
  // ====================================================

  cargarSolicitudes(): void {

    this.cargando = true;
    this.errorCarga = false;

    this.solicitudService
      .getMisSolicitudes()
      .subscribe({

        next: (solicitudes) => {
          this.solicitudes = solicitudes;
          this.cargando = false;
          this.changeDetector
            .detectChanges();
        },

        error: (
          error: HttpErrorResponse
        ) => {

          this.solicitudes = [];
          this.cargando = false;
          this.errorCarga = true;

          this.mostrarToast(
            this.obtenerMensajeError(
              error,
              'No fue posible cargar las solicitudes.'
            ),
            'error'
          );
          this.changeDetector
            .detectChanges();

        }

      });

  }


  // ====================================================
  // ABRIR FORMULARIO
  // ====================================================

  nuevaSolicitud(): void {

    this.solicitudForm.reset();

    this.formularioEnviado = false;
    this.guardando = false;
    this.consultandoHorario = false;
    this.horarioActual = null;
    this.errorHorario = '';
    this.mostrarFormulario = true;

  }
  // ====================================================
  // CANCELAR FORMULARIO
  // ====================================================

  cancelarFormulario(): void {

    if (this.guardando) {
      return;
    }

    this.solicitudForm.reset();
    this.formularioEnviado =
      false;
    this.horarioActual = null;
    this.errorHorario = '';
    this.mostrarFormulario = false;
  }


  // ====================================================
  // CONSULTAR HORARIO DE LA FECHA
  // ====================================================

  consultarHorario(): void {

    this.horarioActual = null;
    this.errorHorario = '';

    const controlFecha = this.solicitudForm.get('fecha_solicitada');
    controlFecha?.markAsTouched();

    if (
      !controlFecha
      ||
      controlFecha.invalid
    ) {
      return;
    }


    const fecha =
      String(
        controlFecha.value || ''
      );


    this.consultandoHorario =
      true;

    this.solicitudService
      .getMiHorarioParaFecha(
        fecha
      )
      .subscribe({

        next: (horario) => {
          this.horarioActual = horario;
          this.consultandoHorario = false;
          this.changeDetector
            .detectChanges();
        },

        error: (
          error: HttpErrorResponse
        ) => {

          this.horarioActual = null;
          this.consultandoHorario = false;
          this.errorHorario = this.obtenerMensajeError(
            error,
            'No fue posible obtener el horario de la fecha seleccionada.'
          );
          this.changeDetector.detectChanges();

        }

      });

  }


  // ====================================================
  // GUARDAR SOLICITUD
  // ====================================================

  guardarSolicitud(): void {

    this.formularioEnviado = true;
    this.solicitudForm.markAllAsTouched();

    if (
      this.solicitudForm.invalid
    ) {
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
      this.horarioActual
        .fecha_solicitada
      !==
      valores.fecha_solicitada
    ) {
      this.horarioActual =
        null;

      this.mostrarToast(
        'La fecha cambió. Volvé a consultar el horario actual.',
        'warning'
      );

      return;
    }


    const solicitud: NuevaSolicitudCambioHorario = {

      fecha_solicitada: valores.fecha_solicitada,
      hora_entrada_solicitada: valores.hora_entrada_solicitada,
      hora_salida_solicitada: valores.hora_salida_solicitada,

      motivo:
        String(
          valores.motivo || ''
        ).trim()

    };

    this.guardando = true;
    this.solicitudService
      .createSolicitud(solicitud).subscribe({

        next: (respuesta) => {

          this.guardando = false;
          this.mostrarFormulario = false;
          this.solicitudForm.reset();
          this.horarioActual = null;
          this.formularioEnviado = false;

          this.mostrarToast(
            respuesta.mensaje,
            'success'
          );

          this.cargarSolicitudes();
          this.changeDetector.detectChanges();

        },

        error: (
          error: HttpErrorResponse
        ) => {

          this.guardando = false;

          this.mostrarToast(
            this.obtenerMensajeError(
              error,
              'No fue posible enviar la solicitud.'
            ),
            'error'
          );
          this.changeDetector.detectChanges();

        }

      });

  }


  // ====================================================
  // VALIDAR FECHA FUTURA
  // ====================================================

  validarFechaFutura(
    control: AbstractControl
  ): ValidationErrors | null {

    const fecha =
      String(
        control.value || ''
      );


    if (!fecha) {
      return null;
    }


    if (
      fecha < this.fechaMinima
    ) {
      return {
        fechaNoFutura:
          true
      };
    }


    return null;

  }


  // ====================================================
  // VALIDAR ORDEN DE HORAS
  // ====================================================

  validarRangoHorario(
    control: AbstractControl
  ): ValidationErrors | null {

    const entrada =
      String(
        control.get(
          'hora_entrada_solicitada'
        )?.value || ''
      );


    const salida =
      String(
        control.get(
          'hora_salida_solicitada'
        )?.value || ''
      );


    if (
      !entrada
      ||
      !salida
    ) {
      return null;
    }


    if (entrada >= salida) {
      return {
        rangoHorarioInvalido:
          true
      };
    }


    return null;

  }


  // ====================================================
  // FECHA MÍNIMA
  // ====================================================

  obtenerFechaManana(): string {

    const fecha =
      new Date();


    fecha.setDate(
      fecha.getDate() + 1
    );


    const anio =
      fecha.getFullYear();

    const mes =
      String(
        fecha.getMonth() + 1
      ).padStart(
        2,
        '0'
      );

    const dia =
      String(
        fecha.getDate()
      ).padStart(
        2,
        '0'
      );


    return `${anio}-${mes}-${dia}`;

  }


  // ====================================================
  // VALIDACIONES VISUALES
  // ====================================================

  campoInvalido(
    nombreCampo: string
  ): boolean {

    const control =
      this.solicitudForm.get(
        nombreCampo
      );


    return Boolean(
      control
      &&
      control.invalid
      &&
      (
        control.touched
        ||
        this.formularioEnviado
      )
    );

  }


  tieneError(
    nombreCampo: string,
    error: string
  ): boolean {

    return Boolean(
      this.solicitudForm
        .get(nombreCampo)
        ?.hasError(error)
    );

  }


  rangoHorarioInvalido():
    boolean {

    return Boolean(
      this.solicitudForm
        .hasError(
          'rangoHorarioInvalido'
        )
      &&
      (
        this.formularioEnviado
        ||
        this.solicitudForm
          .get(
            'hora_salida_solicitada'
          )
          ?.touched
      )
    );

  }


  // ====================================================
  // FORMATEAR FECHA
  // ====================================================

  formatearFecha(
    fecha: string
  ): string {

    if (!fecha) {
      return '-';
    }


    const partes =
      fecha
        .substring(0, 10)
        .split('-');


    if (partes.length !== 3) {
      return fecha;
    }


    const [
      anio,
      mes,
      dia
    ] = partes;


    return `${dia}/${mes}/${anio}`;

  }


  // ====================================================
  // FORMATEAR FECHA Y HORA
  // ====================================================

  formatearFechaHora(
    fechaHora: string | null
  ): string {

    if (!fechaHora) {
      return '-';
    }


    const valorNormalizado =
      fechaHora.includes('T')
        ? fechaHora
        : fechaHora.replace(
          ' ',
          'T'
        );


    const fecha =
      new Date(
        valorNormalizado
      );


    if (
      Number.isNaN(
        fecha.getTime()
      )
    ) {
      return fechaHora;
    }


    return new Intl.DateTimeFormat(
      'es-AR',
      {
        day:
          '2-digit',

        month:
          '2-digit',

        year:
          'numeric',

        hour:
          '2-digit',

        minute:
          '2-digit',

        hourCycle:
          'h23'
      }
    ).format(fecha);

  }


  // ====================================================
  // FORMATEAR HORA
  // ====================================================

  formatearHora(
    hora: string
  ): string {

    if (!hora) {
      return '--:--';
    }


    return hora.substring(
      0,
      5
    );

  }


  // ====================================================
  // TEXTOS DEL ESTADO
  // ====================================================

  obtenerTituloEstado(
    estado: SolicitudEstado
  ): string {

    switch (estado) {

      case 'APROBADA':
        return 'Solicitud aprobada';

      case 'RECHAZADA':
        return 'Solicitud rechazada';

      default:
        return 'En revisión';

    }

  }


  obtenerEtiquetaEstado(
    estado: SolicitudEstado
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
    estado: SolicitudEstado
  ): string {

    switch (estado) {

      case 'APROBADA':
        return 'bi-check-lg';

      case 'RECHAZADA':
        return 'bi-x-lg';

      default:
        return 'bi-clock';

    }

  }


  // ====================================================
  // MENSAJE DE ERROR
  // ====================================================

  obtenerMensajeError(
    error: HttpErrorResponse,
    mensajePredeterminado: string
  ): string {

    return (
      error.error?.mensaje
      ||
      mensajePredeterminado
    );

  }


  // ====================================================
  // TOAST
  // ====================================================

  mostrarToast(
    mensaje: string,
    tipo: TipoToast
  ): void {

    this.toastMensaje =
      mensaje;

    this.toastTipo =
      tipo;

    this.toastVisible =
      true;

  }


  cerrarToast(): void {

    this.toastVisible =
      false;

  }

}