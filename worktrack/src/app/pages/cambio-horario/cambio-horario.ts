import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule,
  ValidationErrors, Validators} from '@angular/forms';
import {HttpErrorResponse} from '@angular/common/http';
import {finalize} from 'rxjs/operators';
import {Header} from '../../components/header/header';
import {Toast, TipoToast} from '../../components/toast/toast';
import {SolicitudService} from '../../services/solicitud.service';
import {AuthService} from '../../services/auth.service';
import { GrupoSolicitudes, HorarioActualFecha, NuevaSolicitudCambioHorario,
  SolicitudCambioHorario, SolicitudEstado, TipoJustificativo,
  NuevaSolicitudJustificativo, SolicitudJustificativo} from '../../models/solicitud.model';
import {Role} from '../../models/user.models';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-cambio-horario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Header, Toast],
  templateUrl: './cambio-horario.html',
  styleUrl: './cambio-horario.css'
})
export class CambioHorario implements OnInit {
  solicitudes: SolicitudCambioHorario[] = [];
  rolActual: Role | null = null;
  cargando = false;
  errorCarga = false;

  // ====================================================
  // FORMULARIO
  // ====================================================

  mostrarFormulario = false;
  activeTab: 'horario' | 'falta' = 'horario'; 
  solicitudForm: FormGroup;
  formularioEnviado = false;
  guardando = false;
  consultandoHorario = false;
  horarioActual: HorarioActualFecha | null = null;
  errorHorario = '';
  fechaMinima: string;

  
  // ====================================================
  // FORMULARIO JUSTIFICATIVO
  // ====================================================

  mostrarFormularioFalta = false;
  justificativoForm: FormGroup;
  formularioFaltaEnviado = false;
  guardandoFalta = false;
  archivoSeleccionado: File | null = null;
  errorArchivo = '';

  // ====================================================
  // TOAST REUTILIZABLE
  // ====================================================

  toastVisible = false;
  toastMensaje = '';
  toastTipo: TipoToast = 'info';

  constructor(
    private formBuilder: FormBuilder,
    private solicitudService: SolicitudService,
    private authService: AuthService,
    private changeDetector: ChangeDetectorRef
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
        modalidad_solicitada: [
          '',
          [Validators.required]
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
        validators: this.validarRangoHorario
      }
    );

    
    this.justificativoForm = this.formBuilder.group({
      fecha_inasistencia: [
        '',
        [Validators.required]
      ],
      tipo_justificativo: [
        '',
        [Validators.required]
      ],
      descripcion: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(500)
        ]
      ]
    });
  }

  // ====================================================
  // INICIALIZACIÓN
  // ====================================================

  ngOnInit(): void {
    this.rolActual = this.authService.getRole() as Role | null;
    this.cargarSolicitudes();
  }
  cambiarTab(tab: 'horario' | 'falta'): void {
  this.activeTab = tab;
  }
  // ====================================================
  // TEXTO SEGÚN EL ROL
  // ====================================================

  get textoAprobacion(): string {
    if (this.rolActual === 'supervisor') {
      return 'El cambio debe ser aprobado por Recursos Humanos.';
    }

    return 'El cambio debe ser aprobado por un supervisor o por Recursos Humanos.';
  }

  // ====================================================
  // GRUPOS POR ESTADO
  // ====================================================

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
    const tipoBuscado =
      this.activeTab === 'falta'
        ? 'JUSTIFICATIVO_FALTA'
        : 'CAMBIO_HORARIO';

    return this.solicitudes.filter(
      solicitud =>
        solicitud.estado === estado &&
        solicitud.tipo === tipoBuscado
    );
  }

  // ====================================================
  // CARGAR SOLICITUDES
  // ====================================================

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

  // ====================================================
  // ABRIR FORMULARIO
  // ====================================================

  nuevaSolicitud(): void {
    this.limpiarFormulario();
    this.guardando = false;
    this.mostrarFormulario = true;
  }

  // ====================================================
  // CANCELAR FORMULARIO
  // ====================================================

  cancelarFormulario(): void {
    if (this.guardando) {
      return;
    }

    this.limpiarFormulario();
    this.mostrarFormulario = false;
  }
  
  // ====================================================
  // ABRIR / CANCELAR FORMULARIO DE FALTA
  // ====================================================

  nuevaSolicitudFalta(): void {
    this.limpiarFormularioFalta();
    this.guardandoFalta = false;
    this.mostrarFormularioFalta = true;
  }

  cancelarFormularioFalta(): void {
    if (this.guardandoFalta) {
      return;
    }

    this.limpiarFormularioFalta();
    this.mostrarFormularioFalta = false;
  }

  private limpiarFormularioFalta(): void {
    this.justificativoForm.reset();
    this.formularioFaltaEnviado = false;
    this.archivoSeleccionado = null;
    this.errorArchivo = '';
  }

  // ====================================================
  // LIMPIAR FORMULARIO
  // ====================================================

  private limpiarFormulario(): void {
    this.solicitudForm.reset();
    this.formularioEnviado = false;
    this.consultandoHorario = false;
    this.horarioActual = null;
    this.errorHorario = '';
  }

  // ====================================================
  // CONSULTAR HORARIO DE LA FECHA
  // ====================================================

  consultarHorario(): void {
    this.horarioActual = null;
    this.errorHorario = '';

    this.solicitudForm
      .get('modalidad_solicitada')
      ?.reset();

    const controlFecha = this.solicitudForm.get(
      'fecha_solicitada'
    );

    controlFecha?.markAsTouched();

    if (!controlFecha || controlFecha.invalid) {
      return;
    }

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

  // ====================================================
  // GUARDAR SOLICITUD
  // ====================================================

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
      fecha_solicitada:
        valores.fecha_solicitada,
      hora_entrada_solicitada:
        valores.hora_entrada_solicitada,
      hora_salida_solicitada:
        valores.hora_salida_solicitada,
      modalidad_solicitada:
        valores.modalidad_solicitada,
      motivo:
        String(valores.motivo || '').trim()
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

          this.mostrarToast(
            respuesta.mensaje,
            'success'
          );

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

  // ====================================================
  // ARCHIVO DEL JUSTIFICATIVO
  // ====================================================

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] || null;

    this.errorArchivo = '';

    if (!archivo) {
      this.archivoSeleccionado = null;
      return;
    }

    const tiposPermitidos = ['image/jpeg', 'image/png', 'application/pdf'];
    const tamanioMaximo = 5 * 1024 * 1024;

    if (!tiposPermitidos.includes(archivo.type)) {
      this.errorArchivo = 'Solo se permiten archivos JPG, PNG o PDF.';
      this.archivoSeleccionado = null;
      input.value = '';
      return;
    }

    if (archivo.size > tamanioMaximo) {
      this.errorArchivo = 'El archivo no puede superar los 5 MB.';
      this.archivoSeleccionado = null;
      input.value = '';
      return;
    }

    this.archivoSeleccionado = archivo;
  }

  // ====================================================
  // GUARDAR JUSTIFICATIVO
  // ====================================================

  guardarJustificativo(): void {
    this.formularioFaltaEnviado = true;
    this.justificativoForm.markAllAsTouched();

    if (this.justificativoForm.invalid) {
      this.mostrarToast(
        'Revisá los campos marcados en el formulario.',
        'warning'
      );
      return;
    }

    const valores = this.justificativoForm.getRawValue();

    this.guardandoFalta = true;

    this.solicitudService
      .createJustificativo(valores, this.archivoSeleccionado)
      .pipe(
        finalize(() => {
          this.guardandoFalta = false;
          this.changeDetector.detectChanges();
        })
      )
      .subscribe({
        next: respuesta => {
          this.mostrarFormularioFalta = false;
          this.limpiarFormularioFalta();

          this.mostrarToast(
            respuesta.mensaje,
            'success'
          );
        },
        error: (error: HttpErrorResponse) => {
          this.mostrarToast(
            this.obtenerMensajeError(
              error,
              'No fue posible enviar el justificativo.'
            ),
            'error'
          );
        }
      });
  }
  // ====================================================
  // VALIDAR FECHA FUTURA
  // ====================================================

  validarFechaFutura(
    control: AbstractControl
  ): ValidationErrors | null {
    const fecha = String(control.value || '');

    if (!fecha) {
      return null;
    }

    if (fecha < this.fechaMinima) {
      return {
        fechaNoFutura: true
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
    const entrada = String(
      control.get(
        'hora_entrada_solicitada'
      )?.value || ''
    );

    const salida = String(
      control.get(
        'hora_salida_solicitada'
      )?.value || ''
    );

    if (!entrada || !salida) {
      return null;
    }

    if (entrada >= salida) {
      return {
        rangoHorarioInvalido: true
      };
    }

    return null;
  }

  // ====================================================
  // FECHA MÍNIMA
  // ====================================================

  obtenerFechaManana(): string {
    const fecha = new Date();

    fecha.setDate(
      fecha.getDate() + 1
    );

    const anio = fecha.getFullYear();

    const mes = String(
      fecha.getMonth() + 1
    ).padStart(2, '0');

    const dia = String(
      fecha.getDate()
    ).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  // ====================================================
  // VALIDACIONES VISUALES
  // ====================================================

  campoInvalido(
    nombreCampo: string
  ): boolean {
    const control = this.solicitudForm.get(
      nombreCampo
    );

    return Boolean(
      control &&
      control.invalid &&
      (
        control.touched ||
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
  
  campoInvalidoFalta(
    nombreCampo: string
  ): boolean {
    const control = this.justificativoForm.get(
      nombreCampo
    );

    return Boolean(
      control &&
      control.invalid &&
      (
        control.touched ||
        this.formularioFaltaEnviado
      )
    );
  }

  tieneErrorFalta(
    nombreCampo: string,
    error: string
  ): boolean {
    return Boolean(
      this.justificativoForm
        .get(nombreCampo)
        ?.hasError(error)
    );
  }

  rangoHorarioInvalido(): boolean {
    return Boolean(
      this.solicitudForm.hasError(
        'rangoHorarioInvalido'
      ) &&
      (
        this.formularioEnviado ||
        this.solicitudForm
          .get('hora_salida_solicitada')
          ?.touched
      )
    );
  }

  // ====================================================
  // FORMATOS
  // ====================================================

  formatearFecha(fecha: string): string {
    if (!fecha) {
      return '-';
    }

    const partes = fecha
      .substring(0, 10)
      .split('-');

    if (partes.length !== 3) {
      return fecha;
    }

    const [anio, mes, dia] = partes;

    return `${dia}/${mes}/${anio}`;
  }

  formatearFechaHora(
    fechaHora: string | null
  ): string {
    if (!fechaHora) {
      return '-';
    }

    const valorNormalizado = fechaHora.includes('T')
      ? fechaHora
      : fechaHora.replace(' ', 'T');

    const fecha = new Date(valorNormalizado);

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

  formatearHora(hora: string): string {
    return hora
      ? hora.substring(0, 5)
      : '--:--';
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
  // TEXTOS DEL JUSTIFICATIVO
  // ====================================================

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
    archivoUrl: string | null
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
  // ====================================================
  // MENSAJE DE ERROR
  // ====================================================

  obtenerMensajeError(
    error: HttpErrorResponse,
    mensajePredeterminado: string
  ): string {
    return (
      error.error?.mensaje ||
      error.error?.message ||
      mensajePredeterminado
    );
  }

  // ====================================================
  // TOAST REUTILIZABLE
  // ====================================================

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