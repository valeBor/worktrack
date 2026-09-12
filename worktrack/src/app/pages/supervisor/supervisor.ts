import {ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID} from '@angular/core';
import {CommonModule, isPlatformBrowser} from '@angular/common';
import {HttpErrorResponse} from '@angular/common/http';
import {Router} from '@angular/router';
import {finalize} from 'rxjs';
import {Header} from '../../components/header/header';
import {AuthService} from '../../services/auth.service';
import {AttendanceHistoryService} from '../../services/attendance-history.service';

@Component({
  selector: 'app-supervisor',
  standalone: true,
  imports: [
    CommonModule,
    Header
  ],
  templateUrl: './supervisor.html',
  styleUrl: './supervisor.css'
})
export class SupervisorComponent implements OnInit {
  isBrowser = false;

  supervisor = {
    nombre: '',
    apellido: '',
    email: '',
    role: '',
    iniciales: ''
  };

  estadoHoy = {
    entrada: '--:--',
    salida: '--:--'
  };

  estadisticas = {
    diasTrabajados: 0,
    horasTotales: 0,
    ausencias: 0,
    tardanzas: 0,
    porcentajeAsistencia: 0,
    jornadasIncompletas: 0
  };

  cargandoEstadisticas = false;
  errorEstadisticas = '';

  // Se reemplazará cuando implementemos
  // el backend real dember de alertas.
  alertas = [
    'Baja asistencia detectada (80%)',
    '2 llegadas tarde este mes',
    'Patrón de bajo rendimiento identificado'
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private historyService: AttendanceHistoryService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID)
    private platformId: Object
  ) {
    this.isBrowser =
      isPlatformBrowser(platformId);
  }

  // ====================================================
  // INICIALIZACIÓN
  // ====================================================

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }

    const user =
      this.authService.getUser();

    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.supervisor = {
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      role: user.role,
      iniciales:
        user.nombre.charAt(0).toUpperCase() +
        user.apellido.charAt(0).toUpperCase()
    };

    this.cargarEstadisticasMensuales();
  }

  // ====================================================
  // CARGAR ESTADÍSTICAS REALES
  // ====================================================

  cargarEstadisticasMensuales(): void {
    this.cargandoEstadisticas = true;
    this.errorEstadisticas = '';

    this.historyService
      .getMyHistory('mes_actual')
      .pipe(
        finalize(() => {
          this.cargandoEstadisticas = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: history => {
          this.estadisticas = {
            diasTrabajados:
              history.resumen.dias_presentes,

            horasTotales:
              history.resumen.horas_totales,

            ausencias:
              history.resumen.ausencias,

            tardanzas:
              history.resumen.llegadas_tarde,

            porcentajeAsistencia:
              history.resumen.porcentaje_asistencia,

            jornadasIncompletas:
              history.resumen.registros_incompletos
          };
        },
        error: (error: HttpErrorResponse) => {
          this.estadisticas = {
            diasTrabajados: 0,
            horasTotales: 0,
            ausencias: 0,
            tardanzas: 0,
            porcentajeAsistencia: 0,
            jornadasIncompletas: 0
          };

          this.errorEstadisticas =
            this.obtenerMensajeError(
              error,
              'No fue posible obtener las estadísticas mensuales.'
            );
        }
      });
  }

  // ====================================================
  // NAVEGACIÓN
  // ====================================================

  verAlertas(): void {
    console.log('Ver alertas');
  }

  escanearQR(): void {
    this.router.navigate(['/scanner']);
  }

  verHistorial(): void {
    this.router.navigate(['/historial']);
  }

  gestionCronogramas(): void {
    this.router.navigate([
      '/gestion-cronogramas'
    ]);
  }

  solicitarCambioHorario(): void {
    this.router.navigate([
      '/cambio-horario'
    ]);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // ====================================================
  // MENSAJES DE ERROR
  // ====================================================

  private obtenerMensajeError(
    error: HttpErrorResponse,
    mensajePredeterminado: string
  ): string {
    return (
      error.error?.mensaje ||
      error.error?.message ||
      mensajePredeterminado
    );
  }
}