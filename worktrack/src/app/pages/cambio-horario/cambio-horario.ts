import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {HttpErrorResponse, HttpResponse} from '@angular/common/http';
import {finalize} from 'rxjs/operators';
import {Header} from '../../components/header/header';
import {Toast, TipoToast} from '../../components/toast/toast';
import {SolicitudService} from '../../services/solicitud.service';
import {AuthService} from '../../services/auth.service';
import {
  GrupoSolicitudes,
  HorarioActualFecha,
  NuevaSolicitudCambioHorario,
  NuevaSolicitudJustificativo,
  SolicitudCambioHorario,
  SolicitudEstado,
  SolicitudTipo,
  TipoJustificativo
} from '../../models/solicitud.model';
import {Role} from '../../models/user.models';

@Component({
  selector: 'app-cambio-horario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Header, Toast],
  templateUrl: './cambio-horario.html',
  styleUrl: './cambio-horario.css'
})
export class CambioHorario implements OnInit {
  @ViewChild('archivoJustificativoInput')
  archivoInput?: ElementRef<HTMLInputElement>;

  private readonly maximoArchivoBytes = 4 * 1024 * 1024;
  private readonly tiposArchivoPermitidos = [
    'image/jpeg',
    'image/png',
    'application/pdf'
  ];

  solicitudes: SolicitudCambioHorario[] = [];
  rolActual: Role | null = null;
  cargando = false;
  errorCarga = false;

  activeTab: 'horario' | 'falta' = 'horario';

  mostrarFormulario = false;
  solicitudForm: FormGroup;
  formularioEnviado = false;
  guardando = false;
  consultandoHorario = false;
  horarioActual: HorarioActualFecha | null = null;
  errorHorario = '';
  fechaMinima: string;

  mostrarFormularioFalta = false;
  justificativoForm: FormGroup;
  formularioFaltaEnviado = false;
  guardandoFalta = false;
  archivoSeleccionado: File | null = null;
  errorArchivo = '';
  fechaMaximaInasistencia: string;

  procesandoArchivoId: number | null = null;

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
    this.fechaMaximaInasistencia = this.obtenerFechaArgentina();

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

    this.justificativoForm = this.formBuilder.group({
      fecha_inasistencia: [
        '',
        [
          Validators.required,
          this.validarFechaInasistencia.bind(this)
        ]
      ],
      tipo_justificativo: ['', Validators.required],
      motivo: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(500)
        ]
      ]
    });
  }

  ngOnInit(): void {
    this.rolActual = this.authService.getRole() as Role | null;
    this.cargarSolicitudes();
  }

  get textoAprobacion(): string {
    if (this.rolActual === 'supervisor') {
      return 'El cambio debe ser aprobado por Recursos Humanos.';
    }

    return 'El cambio debe ser aprobado por un supervisor o por Recursos Humanos.';
  }

  get archivoObligatorio(): boolean {
    const tipo = this.justificativoForm.get(
      'tipo_justificativo'
    )?.value as TipoJustificativo | '';

    return tipo === 'CERTIFICADO_MEDICO' ||
      tipo === 'CERTIFICADO_ESTUDIO';
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

  cambiarTab(tab: 'horario' | 'falta'): void {
    this.activeTab = tab;
    this.cancelarFormulariosAbiertos();
  }

  private filtrarSolicitudes(
    estado: SolicitudEstado
  ): SolicitudCambioHorario[] {
    const tipo: SolicitudTipo = this.activeTab === 'falta'
      ? 'JUSTIFICACION_INASISTENCIA'
      : 'CAMBIO_HORARIO';

    return this.solicitudes.filter(
      solicitud =>
        solicitud.estado === estado &&
        solicitud.tipo === tipo
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

  nuevaSolicitudFalta(): void {
    this.limpiarFormularioFalta();
    this.guardandoFalta = false;
    this.mostrarFormularioFalta = true;
  }

  cancelarFormularioFalta(): void {
    if (this.guardandoFalta) return;

    this.limpiarFormularioFalta();
    this.mostrarFormularioFalta = false;
  }

  private cancelarFormulariosAbiertos(): void {
    if (!this.guardando) {
      this.mostrarFormulario = false;
      this.limpiarFormulario();
    }

    if (!this.guardandoFalta) {
      this.mostrarFormularioFalta = false;
      this.limpiarFormularioFalta();
    }
  }

  private limpiarFormulario(): void {
    this.solicitudForm.reset();
    this.formularioEnviado = false;
    this.consultandoHorario = false;
    this.horarioActual = null;
    this.errorHorario = '';
  }

  private limpiarFormularioFalta(): void {
    this.justificativoForm.reset();
    this.formularioFaltaEnviado = false;
    this.archivoSeleccionado = null;
    this.errorArchivo = '';

    if (this.archivoInput) {
      this.archivoInput.nativeElement.value = '';
    }
  }

  consultarHorario(): void {
    this.horarioActual = null;
    this.errorHorario = '';
    this.solicitudForm.get('modalidad_solicitada')?.reset();

    const controlFecha = this.solicitudForm.get(
      'fecha_solicitada'
    );

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

  onTipoJustificativoChange(): void {
    this.errorArchivo = '';

    if (
      !this.archivoObligatorio &&
      !this.archivoSeleccionado
    ) {
      return;
    }

    if (this.archivoSeleccionado) {
      this.validarArchivoSeleccionado(
        this.archivoSeleccionado
      );
    }
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;

    this.errorArchivo = '';
    this.archivoSeleccionado = null;

    if (!archivo) return;

    if (!this.validarArchivoSeleccionado(archivo)) {
      input.value = '';
      return;
    }

    this.archivoSeleccionado = archivo;
  }

  private validarArchivoSeleccionado(
    archivo: File
  ): boolean {
    if (!this.tiposArchivoPermitidos.includes(archivo.type)) {
      this.errorArchivo =
        'Solo se permiten archivos JPG, PNG o PDF.';
      return false;
    }

    if (archivo.size <= 0) {
      this.errorArchivo = 'El archivo seleccionado está vacío.';
      return false;
    }

    if (archivo.size > this.maximoArchivoBytes) {
      this.errorArchivo =
        'El archivo no puede superar los 4 MB.';
      return false;
    }

    this.errorArchivo = '';
    return true;
  }

  quitarArchivo(): void {
    if (this.guardandoFalta) return;

    this.archivoSeleccionado = null;
    this.errorArchivo = '';

    if (this.archivoInput) {
      this.archivoInput.nativeElement.value = '';
    }
  }

  guardarJustificativo(): void {
    this.formularioFaltaEnviado = true;
    this.justificativoForm.markAllAsTouched();
    this.errorArchivo = '';

    if (this.justificativoForm.invalid) {
      this.mostrarToast(
        'Revisá los campos marcados en el formulario.',
        'warning'
      );
      return;
    }

    if (this.archivoObligatorio && !this.archivoSeleccionado) {
      this.errorArchivo =
        'Debés adjuntar el certificado en formato JPG, PNG o PDF.';

      this.mostrarToast(
        'Seleccioná el archivo del certificado.',
        'warning'
      );
      return;
    }

    if (
      this.archivoSeleccionado &&
      !this.validarArchivoSeleccionado(
        this.archivoSeleccionado
      )
    ) {
      return;
    }

    const valores = this.justificativoForm.getRawValue();

    const justificativo: NuevaSolicitudJustificativo = {
      fecha_inasistencia:
        String(valores.fecha_inasistencia || ''),
      tipo_justificativo:
        valores.tipo_justificativo as TipoJustificativo,
      motivo: String(valores.motivo || '').trim()
    };

    this.guardandoFalta = true;

    this.solicitudService
      .createJustificativo(
        justificativo,
        this.archivoSeleccionado
      )
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
          this.mostrarToast(respuesta.mensaje, 'success');
          this.cargarSolicitudes();
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
          this.changeDetector.detectChanges();
        })
      )
      .subscribe({
        next: response => {
          this.procesarRespuestaArchivo(
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

  private procesarRespuestaArchivo(
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

  validarFechaFutura(
    control: AbstractControl
  ): ValidationErrors | null {
    const fecha = String(control.value || '');

    if (!fecha) return null;

    return fecha < this.fechaMinima
      ? {fechaNoFutura: true}
      : null;
  }

  validarFechaInasistencia(
    control: AbstractControl
  ): ValidationErrors | null {
    const fecha = String(control.value || '');

    if (!fecha) return null;

    return fecha > this.fechaMaximaInasistencia
      ? {fechaFutura: true}
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

  obtenerFechaManana(): string {
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

  campoInvalido(nombreCampo: string): boolean {
    const control = this.solicitudForm.get(nombreCampo);

    return Boolean(
      control &&
      control.invalid &&
      (control.touched || this.formularioEnviado)
    );
  }

  tieneError(
    nombreCampo: string,
    error: string
  ): boolean {
    return Boolean(
      this.solicitudForm.get(nombreCampo)?.hasError(error)
    );
  }

  campoInvalidoFalta(nombreCampo: string): boolean {
    const control = this.justificativoForm.get(nombreCampo);

    return Boolean(
      control &&
      control.invalid &&
      (control.touched || this.formularioFaltaEnviado)
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
      this.solicitudForm.hasError('rangoHorarioInvalido') &&
      (
        this.formularioEnviado ||
        this.solicitudForm
          .get('hora_salida_solicitada')
          ?.touched
      )
    );
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

  formatearHora(hora: string | null): string {
    return hora ? hora.substring(0, 5) : '--:--';
  }

  formatearTamanio(bytes: number | null | undefined): string {
    if (!bytes) return '';

    if (bytes < 1024 * 1024) {
      return `${Math.ceil(bytes / 1024)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  obtenerTituloEstado(estado: SolicitudEstado): string {
    switch (estado) {
      case 'APROBADA':
        return 'Solicitud aprobada';
      case 'RECHAZADA':
        return 'Solicitud rechazada';
      default:
        return 'En revisión';
    }
  }

  obtenerEtiquetaEstado(estado: SolicitudEstado): string {
    switch (estado) {
      case 'APROBADA':
        return 'Aprobada';
      case 'RECHAZADA':
        return 'Rechazada';
      default:
        return 'Pendiente';
    }
  }

  obtenerIconoEstado(estado: SolicitudEstado): string {
    switch (estado) {
      case 'APROBADA':
        return 'bi-check-lg';
      case 'RECHAZADA':
        return 'bi-x-lg';
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

  private obtenerMensajeErrorBlob(
    error: HttpErrorResponse,
    mensajePredeterminado: string
  ): string {
    if (!(error.error instanceof Blob)) {
      return this.obtenerMensajeError(
        error,
        mensajePredeterminado
      );
    }

    return mensajePredeterminado;
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