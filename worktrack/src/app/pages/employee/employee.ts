import {ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID} from '@angular/core';
import {CommonModule, isPlatformBrowser} from '@angular/common';
import {HttpErrorResponse} from '@angular/common/http';
import {Router} from '@angular/router';
import {Header} from '../../components/header/header';
import {AlertPanel} from '../../components/alert-panel/alert-panel';
import {AuthService} from '../../services/auth.service';
import {HorarioService} from '../../services/horario.service';
import {AsistenciaService} from '../../services/asistecia.service';
import {AttendanceHistoryService} from '../../services/attendance-history.service';
import {Horario} from '../../models/horario.model';
import {AsistenciaHoy} from '../../models/asistencia.model';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [Header, AlertPanel, CommonModule],
  templateUrl: './employee.html',
  styleUrl: './employee.css'
})
export class Employee implements OnInit {
  isBrowser = false;

  empleado = {
    nombre: '',
    apellido: '',
    email: '',
    role: '',
    iniciales: ''
  };

  horarioHoy: Horario | null = null;
  asistenciaHoy: AsistenciaHoy | null = null;

  cargandoHorario = true;
  cargandoAsistencia = true;
  cargandoEstadisticas = true;
  registrando = false;

  mensaje = '';
  errorHorario = '';
  errorAsistencia = '';
  errorEstadisticas = '';

  estadisticas = {
    diasTrabajados: 0,
    horasTotales: 0,
    ausencias: 0,
    tardanzas: 0,
    porcentajeAsistencia: 0,
    jornadasIncompletas: 0
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private horarioService: HorarioService,
    private asistenciaService: AsistenciaService,
    private historyService: AttendanceHistoryService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;

    const user = this.authService.getUser();

    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.empleado = {
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      role: user.role,
      iniciales:
        user.nombre.charAt(0).toUpperCase() +
        user.apellido.charAt(0).toUpperCase()
    };

    this.cargarHorarioHoy();
    this.cargarAsistenciaHoy();
    this.cargarEstadisticasMensuales();
  }

  get error(): string {
    return this.errorHorario || this.errorAsistencia;
  }

  cargarHorarioHoy(): void {
    this.cargandoHorario = true;
    this.errorHorario = '';

    this.horarioService.getMiHorarioHoy().subscribe({
      next: horario => {
        this.horarioHoy = horario;
        this.cargandoHorario = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.horarioHoy = null;
        this.cargandoHorario = false;

        if (err.status !== 404) {
          this.errorHorario = this.obtenerMensajeError(
            err,
            'No fue posible obtener el horario de hoy.'
          );
        }

        this.cdr.detectChanges();
      }
    });
  }

  cargarAsistenciaHoy(): void {
    this.cargandoAsistencia = true;
    this.errorAsistencia = '';

    this.asistenciaService.obtenerMiAsistenciaHoy().subscribe({
      next: data => {
        this.asistenciaHoy = data;
        this.cargandoAsistencia = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.asistenciaHoy = null;
        this.cargandoAsistencia = false;
        this.errorAsistencia = this.obtenerMensajeError(
          err,
          'No fue posible obtener la asistencia de hoy.'
        );
        this.cdr.detectChanges();
      }
    });
  }

  cargarEstadisticasMensuales(): void {
    this.cargandoEstadisticas = true;
    this.errorEstadisticas = '';

    this.historyService.getMyHistory('mes_actual').subscribe({
      next: history => {
        this.estadisticas = {
          diasTrabajados: history.resumen.dias_presentes,
          horasTotales: history.resumen.horas_totales,
          ausencias: history.resumen.ausencias,
          tardanzas: history.resumen.llegadas_tarde,
          porcentajeAsistencia: history.resumen.porcentaje_asistencia,
          jornadasIncompletas: history.resumen.registros_incompletos
        };

        this.cargandoEstadisticas = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.estadisticas = {
          diasTrabajados: 0,
          horasTotales: 0,
          ausencias: 0,
          tardanzas: 0,
          porcentajeAsistencia: 0,
          jornadasIncompletas: 0
        };

        this.cargandoEstadisticas = false;
        this.errorEstadisticas = this.obtenerMensajeError(
          err,
          'No fue posible obtener las estadísticas mensuales.'
        );
        this.cdr.detectChanges();
      }
    });
  }

  accionAsistencia(): void {
    if (
      !this.horarioHoy ||
      !this.asistenciaHoy ||
      this.asistenciaHoy.jornadaCompletada ||
      this.registrando
    ) {
      return;
    }

    const modalidad = String(this.horarioHoy.modalidad).toUpperCase();

    if (modalidad === 'PRESENCIAL') {
      this.router.navigate(['/scanner']);
      return;
    }

    if (modalidad === 'HOME') this.registrarAsistenciaHome();
  }

  registrarAsistenciaHome(): void {
    const tipo = this.asistenciaHoy?.proximaAccion;

    if (!tipo || this.asistenciaHoy?.jornadaCompletada || this.registrando) {
      return;
    }

    this.registrando = true;
    this.mensaje = '';
    this.errorAsistencia = '';

    this.asistenciaService.registrarAsistencia({tipo}).subscribe({
      next: respuesta => {
        this.registrando = false;
        this.mensaje = respuesta.mensaje ||
          'Asistencia registrada correctamente.';

        this.cargarAsistenciaHoy();
        this.cargarEstadisticasMensuales();
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.registrando = false;
        this.errorAsistencia = this.obtenerMensajeError(
          err,
          'No fue posible registrar la asistencia.'
        );
        this.cdr.detectChanges();
      }
    });
  }

  get textoBotonAsistencia(): string {
    if (this.registrando) return 'Registrando...';
    if (this.cargandoHorario || this.cargandoAsistencia) return 'Cargando...';
    if (!this.horarioHoy) return 'Sin horario asignado';
    if (!this.asistenciaHoy) return 'Asistencia no disponible';
    if (this.asistenciaHoy.jornadaCompletada) return 'Jornada completada';

    if (String(this.horarioHoy.modalidad).toUpperCase() === 'PRESENCIAL') {
      return 'Escanear QR';
    }

    return this.asistenciaHoy.proximaAccion === 'salida'
      ? 'Registrar salida'
      : 'Registrar entrada';
  }

  get subtituloBotonAsistencia(): string {
    if (this.cargandoHorario || this.cargandoAsistencia) {
      return 'Consultando estado actual';
    }

    if (!this.horarioHoy) return 'No tiene una jornada programada para hoy';
    if (!this.asistenciaHoy) return 'Intente nuevamente más tarde';
    if (this.asistenciaHoy.jornadaCompletada) {
      return 'Entrada y salida registradas';
    }

    if (String(this.horarioHoy.modalidad).toUpperCase() === 'PRESENCIAL') {
      return 'Registrar asistencia presencial';
    }

    return this.asistenciaHoy.proximaAccion === 'salida'
      ? 'Finalizar jornada HOME'
      : 'Iniciar jornada HOME';
  }

  get horarioEntrada(): string {
    return this.horarioHoy?.hora_entrada
      ? this.horarioHoy.hora_entrada.substring(0, 5)
      : '--:--';
  }

  get horarioSalida(): string {
    return this.horarioHoy?.hora_salida
      ? this.horarioHoy.hora_salida.substring(0, 5)
      : '--:--';
  }

  get entradaRegistrada(): string {
    const hora = this.asistenciaHoy?.asistencia?.hora_entrada;
    return hora ? hora.substring(0, 5) : '--:--';
  }

  get salidaRegistrada(): string {
    const hora = this.asistenciaHoy?.asistencia?.hora_salida;
    return hora ? hora.substring(0, 5) : '--:--';
  }

  verHistorial(): void {
    this.router.navigate(['/historial']);
  }

  gestionCambioDeHorario(): void {
    this.router.navigate(['/cambio-horario']);
  }

  private obtenerMensajeError(
    error: HttpErrorResponse,
    mensajePredeterminado: string
  ): string {
    return error.error?.mensaje ||
      error.error?.message ||
      mensajePredeterminado;
  }
}