import {ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, PLATFORM_ID} from '@angular/core';
import {CommonModule, isPlatformBrowser} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription, finalize} from 'rxjs';
import {jsPDF} from 'jspdf';
import autoTable from 'jspdf-autotable';
import {Header} from '../../components/header/header';
import {Toast, TipoToast} from '../../components/toast/toast';
import {AttendanceReportService} from '../../services/attendance-report.service';
import {
  AttendanceJourneyStatus,
  AttendanceReportModality,
  AttendanceReportRecord,
  AttendanceReportStatus,
  AttendanceReportSummary,
  DailyAttendanceReport,
  GlobalAttendanceHistory,
  ReportableRole,
  ReportableUser
} from '../../models/attendance-report.model';

type AttendanceReportTab =
  | 'diario'
  | 'historial';

@Component({
  selector: 'app-attendance-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Header,
    Toast
  ],
  templateUrl: './attendance-report.html',
  styleUrl: './attendance-report.css'
})
export class AttendanceReport implements OnInit, OnDestroy {
  isBrowser = false;
  activeTab: AttendanceReportTab = 'diario';

  reportableUsers: ReportableUser[] = [];
  dailyReport: DailyAttendanceReport | null = null;
  globalHistory: GlobalAttendanceHistory | null = null;

  today = '';
  selectedDailyDate = '';
  historyDateFrom = '';
  historyDateTo = '';
  selectedUserId: number | null = null;
  selectedRole: ReportableRole | null = null;
  selectedStatus: AttendanceReportStatus | null = null;

  loadingUsers = false;
  loadingDaily = false;
  loadingHistory = false;

  dailyError = '';
  historyError = '';

  toastVisible = false;
  toastMessage = '';
  toastType: TipoToast = 'info';

  private routeSubscription:
    Subscription | null = null;

  constructor(
    private reportService: AttendanceReportService,
    private route: ActivatedRoute,
    private router: Router,
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

    this.today =
      this.getCurrentDate();

    this.selectedDailyDate =
      this.today;

    this.historyDateFrom =
      `${this.today.substring(0, 7)}-01`;

    this.historyDateTo =
      this.today;

    this.loadReportableUsers();

    this.routeSubscription =
      this.route.queryParamMap
        .subscribe(params => {
          const requestedTab =
            params.get('tab');

          this.activeTab =
            requestedTab === 'historial'
              ? 'historial'
              : 'diario';

          if (
            this.activeTab ===
            'diario'
          ) {
            this.loadDailyReport();
          } else {
            this.loadGlobalHistory();
          }
        });
  }

  ngOnDestroy(): void {
    this.routeSubscription
      ?.unsubscribe();
  }

  // ====================================================
  // FECHA ACTUAL DE ARGENTINA
  // ====================================================

  private getCurrentDate(): string {
    const parts =
      new Intl.DateTimeFormat(
        'en-CA',
        {
          timeZone:
            'America/Argentina/Buenos_Aires',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }
      ).formatToParts(new Date());

    const values:
      Record<string, string> = {};

    for (const part of parts) {
      if (part.type !== 'literal') {
        values[part.type] =
          part.value;
      }
    }

    return (
      `${values['year']}-` +
      `${values['month']}-` +
      `${values['day']}`
    );
 }

  // ====================================================
  // CAMBICHANTE PESTAÑA
  // ====================================================

  changeTab(
    tab: AttendanceReportTab
  ): void {
    if (this.activeTab === tab) {
      return;
    }

    this.router.navigate(
      [],
      {
        relativeTo: this.route,
        queryParams: {tab},
        queryParamsHandling: 'merge'
      }
    );
  }

  // ====================================================
  // USUARIOS REPORTABLES
  // ====================================================

  loadReportableUsers(): void {
    this.loadingUsers = true;

    this.reportService
      .getReportableUsers()
      .pipe(
        finalize(() => {
          this.loadingUsers = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: users => {
          this.reportableUsers = users;
        },
        error: error => {
          this.reportableUsers = [];

          this.showToast(
            error.error?.mensaje ||
            'No fue posible obtener los usuarios.',
            'error'
          );
        }
      });
  }

  // ====================================================
  // REPORTE DIARIO
  // ====================================================

  loadDailyReport(): void {
    if (!this.selectedDailyDate) {
      this.dailyError =
        'Seleccioná una fecha válida.';
      return;
    }

    this.loadingDaily = true;
    this.dailyError = '';

    this.reportService
      .getDailyReport(
        this.selectedDailyDate
      )
      .pipe(
        finalize(() => {
          this.loadingDaily = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: report => {
          this.dailyReport = report;
        },
        error: error => {
          this.dailyReport = null;

          this.dailyError =
            error.error?.mensaje ||
            'No fue posible obtener el reporte diario.';

          this.showToast(
            this.dailyError,
            'error'
          );
        }
      });
  }

  onDailyDateChange(): void {
    this.loadDailyReport();
  }

  // ====================================================
  // HISTORIAL GLOBAL
  // ====================================================

  loadGlobalHistory(): void {
    if (
      !this.historyDateFrom ||
      !this.historyDateTo
    ) {
      this.historyError =
        'Seleccioná las dos fechas del período.';
      return;
    }

    if (
      this.historyDateFrom >
      this.historyDateTo
    ) {
      this.historyError =
        'La fecha desde no puede ser posterior a la fecha hasta.';
      return;
    }

    this.loadingHistory = true;
    this.historyError = '';

    this.reportService
      .getGlobalHistory({
        fechaDesde:
          this.historyDateFrom,

        fechaHasta:
          this.historyDateTo,

        usuarioId:
          this.selectedUserId,

        role:
          this.selectedRole,

        estado:
          this.selectedStatus
      })
      .pipe(
        finalize(() => {
          this.loadingHistory = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: history => {
          this.globalHistory = history;
        },
        error: error => {
          this.globalHistory = null;

          this.historyError =
            error.error?.mensaje ||
            'No fue posible obtener el historial global.';

          this.showToast(
            this.historyError,
            'error'
          );
        }
      });
  }

  applyHistoryFilters(): void {
    this.loadGlobalHistory();
  }

  clearHistoryFilters(): void {
    this.historyDateFrom =
      `${this.today.substring(0, 7)}-01`;

    this.historyDateTo =
      this.today;

    this.selectedUserId = null;
    this.selectedRole = null;
    this.selectedStatus = null;

    this.loadGlobalHistory();
  }

  // ====================================================
  // EXPORTAR REPORTE DIARIO
  // ====================================================

  exportDailyReport(): void {
    if (
      !this.dailyReport ||
      this.dailyReport.registros.length === 0
    ) {
      return;
    }

    this.exportReport(
      'Reporte diario de asistencia',
      this.formatDate(
        this.dailyReport.fecha
      ),
      this.dailyReport.resumen,
      this.dailyReport.registros,
      `reporte-diario-${this.dailyReport.fecha}.pdf`
    );
  }

  // ====================================================
  // EXPORTAR HISTORIAL
  // ====================================================

  exportGlobalHistory(): void {
    if (
      !this.globalHistory ||
      this.globalHistory.registros.length === 0
    ) {
      return;
    }

    const period =
      `${this.formatDate(
        this.globalHistory
          .periodo.fecha_desde
      )} - ${this.formatDate(
        this.globalHistory
          .periodo.fecha_hasta
      )}`;

    this.exportReport(
      'Historial global de asistencia',
      period,
      this.globalHistory.resumen,
      this.globalHistory.registros,
      'historial-global-asistencia.pdf'
    );
  }

  // ====================================================
  // GENERAR PDF
  // ====================================================

  private exportReport(
    title: string,
    period: string,
    summary: AttendanceReportSummary,
    records: AttendanceReportRecord[],
    fileName: string
  ): void {
    const document = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    document.setFontSize(18);
    document.text(
      title,
      14,
      16
    );

    document.setFontSize(10);

    document.text(
      `Período: ${period}`,
      14,
      24
    );

    document.text(
      `Presentes: ${summary.registros_presentes} | ` +
      `Ausencias: ${summary.ausencias} | ` +
      `Tardanzas: ${summary.tardanzas} | ` +
      `Asistencia: ${summary.porcentaje_asistencia}%`,
      14,
      31
    );

    autoTable(
      document,
      {
        startY: 38,

        head: [[
          'Fecha',
          'Usuario',
          'Rol',
          'Estado',
          'Entrada',
          'Salida',
          'Horas',
          'Modalidad'
        ]],

        body: records.map(
          record => [
            this.formatDate(
              record.fecha
            ),

            `${record.usuario.nombre} ` +
            `${record.usuario.apellido}`,

            this.getRoleLabel(
              record.usuario.role
            ),

            this.getStatusLabel(
              record.estado
            ),

            this.formatTime(
              record.hora_entrada
            ),

            this.formatTime(
              record.hora_salida
            ),

            this.formatWorkedHours(
              record.horas_trabajadas
            ),

            this.getModalityLabel(
              record.modalidad
            )
          ]
        ),

        styles: {
          fontSize: 8,
          cellPadding: 2
        },

        headStyles: {
          fillColor: [
            23,
            52,
            81
          ]
        }
      }
    );

    document.save(fileName);

    this.showToast(
      'El reporte se exportó correctamente.',
      'success'
    );
  }

  // ====================================================
  // FORMATOS
  // ====================================================

  formatDate(date: string): string {
    const [
      year,
      month,
      day
    ] = String(date)
      .substring(0, 10)
      .split('-')
      .map(Number);

    if (
      !year ||
      !month ||
      !day
    ) {
      return date;
    }

    return new Intl.DateTimeFormat(
      'es-AR',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }
    ).format(
      new Date(
        year,
        month -1,
        day
      )
    );
  }

  formatTime(
    time: string | null
  ): string {
    return time
      ? time.substring(0, 5)
      : '--:--';
  }

  formatWorkedHours(
    hours: number
  ): string {
    return `${Number(
      hours || 0
    ).toFixed(2)} h`;
  }

  getInitials(
    user: ReportableUser
  ): string {
    return (
      user.nombre
        .charAt(0)
        .toUpperCase() +
      user.apellido
        .charAt(0)
        .toUpperCase()
    ) || '?';
  }

  getRoleLabel(
    role: ReportableRole
  ): string {
    return role === 'supervisor'
      ? 'Supervisor'
      : 'Empleado';
  }

  getStatusLabel(
    status: AttendanceReportStatus
  ): string {
    const labels:
      Record<
        AttendanceReportStatus,
        string
      > = {
        PRESENTE: 'Presente',
        TARDE: 'Tarde',
        AUSENTE: 'Ausente',
        PENDIENTE: 'Pendiente',
        SIN_HORARIO: 'Sin horario'
      };

    return labels[status];
  }

  getJourneyLabel(
    status: AttendanceJourneyStatus
  ): string {
    const labels:
      Record<
        AttendanceJourneyStatus,
        string
      > = {
        SIN_REGISTRO: 'Sin registro',
        EN_CURSO: 'En curso',
        COMPLETA: 'Completa',
        INCOMPLETA: 'Incompleta'
      };

    return labels[status];
  }

  getModalityLabel(
    modality: AttendanceReportModality
  ): string {
    if (modality === 'PRESENCIAL') {
      return 'Presencial';
    }

    if (modality === 'HOME') {
      return 'Home';
    }

    return 'Sin modalidad';
  }

  getStatusClass(
    status: AttendanceReportStatus
  ): string {
    return `status-${status
      .toLowerCase()
      .replace('_', '-')}`;
  }

  // ====================================================
  // TOAST
  // ====================================================

  showToast(
    message: string,
    type: TipoToast
  ): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    this.cdr.detectChanges();
  }

  closeToast(): void {
    this.toastVisible = false;
    this.cdr.detectChanges();
  }
}