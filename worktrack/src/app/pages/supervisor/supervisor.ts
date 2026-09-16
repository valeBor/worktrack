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
  selector: 'app-supervisor',
  standalone: true,
  imports: [CommonModule, Header, AlertPanel],
  templateUrl: './supervisor.html',
  styleUrl: './supervisor.css'
})
export class SupervisorComponent implements OnInit {
  supervisor = {
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
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const user = this.authService.getUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.supervisor = {
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      role: user.role,
      iniciales: user.nombre.charAt(0).toUpperCase() +
        user.apellido.charAt(0).toUpperCase()
    };

    this.cargarHorarioHoy();
    this.cargarAsistenciaHoy();
    this.cargarEstadisticasMensuales();
  }

  cargarHorarioHoy(): void {
    this.cargandoHorario = true;
    this.errorHorario = '';

    this.horarioService.getMiHorarioHoy().subscribe({
      next: horario => {
        this.horarioHoy = horario;
        this.cargandoHorario = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.horarioHoy = null;
        this.cargandoHorario = false;
        if (error.status !== 404) {
          this.errorHorario = this.obtenerMensajeError(
            error,
            'No fue posible obtener el horario de hoy.'
          );
        }
        this.cdr.markForCheck();
      }
    });
  }

  cargarAsistenciaHoy(): void {
    this.cargandoAsistencia = true;
    this.errorAsistencia = '';

    this.asistenciaService.obtenerMiAsistenciaHoy().subscribe({
      next: asistencia => {
        this.asistenciaHoy = asistencia;
        this.cargandoAsistencia = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.asistenciaHoy = null;
        this.cargandoAsistencia = false;
        this.errorAsistencia = this.obtenerMensajeError(
          error,
          'No fue posible obtener la asistencia de hoy.'
        );
        this.cdr.markForCheck();
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
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.errorEstadisticas = this.obtenerMensajeError(
          error,
          'No fue posible obtener las estadísticas mensuales.'
        );
        this.cargandoEstadisticas = false;
        this.cdr.markForCheck();
      }
    });
  }

  get horarioEntrada(): string {
    return this.horarioHoy?.hora_entrada?.substring(0, 5) || '--:--';
  }

  get horarioSalida(): string {
    return this.horarioHoy?.hora_salida?.substring(0, 5) || '--:--';
  }

  get entradaRegistrada(): string {
    return this.asistenciaHoy?.asistencia?.hora_entrada?.substring(0, 5) || '--:--';
  }

  get salidaRegistrada(): string {
    return this.asistenciaHoy?.asistencia?.hora_salida?.substring(0, 5) || '--:--';
  }

  get subtituloQR(): string {
    if (this.cargandoHorario || this.cargandoAsistencia) {
      return 'Consultando jornada';
    }
    if (!this.horarioHoy) return 'Sin jornada programada';
    if (!this.asistenciaHoy) return 'Asistencia no disponible';
    if (this.asistenciaHoy.jornadaCompletada) return 'Jornada completada';
    return this.asistenciaHoy.proximaAccion === 'salida'
      ? 'Marcar salida'
      : 'Marcar entrada';
  }

  escanearQR(): void {
    if (
      !this.horarioHoy ||
      !this.asistenciaHoy ||
      this.asistenciaHoy.jornadaCompletada
    ) return;

    this.router.navigate(['/scanner']);
  }

  verHistorial(): void {
    this.router.navigate(['/historial']);
  }

  gestionCronogramas(): void {
    this.router.navigate(['/gestion-cronogramas']);
  }

  solicitarCambioHorario(): void {
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