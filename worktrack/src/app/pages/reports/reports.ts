import {ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID} from '@angular/core';
import {CommonModule, isPlatformBrowser} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {finalize} from 'rxjs';
import {Header} from '../../components/header/header';
import {Toast, TipoToast} from '../../components/toast/toast';
import {AttendanceReportService} from '../../services/attendance-report.service';
import {
  AttendanceStatistics,
  AttendanceStatisticsByModality,
  AttendanceStatisticsByRole,
  AttendanceStatisticsByUser,
  DailyAttendanceStatistics,
  ReportableRole,
  ReportableUser
} from '../../models/attendance-report.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Header,
    Toast
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports implements OnInit {
  isBrowser = false;

  statistics: AttendanceStatistics | null = null;
  reportableUsers: ReportableUser[] = [];

  today = '';
  dateFrom = '';
  dateTo = '';
  selectedUserId: number | null = null;
  selectedRole: ReportableRole | null = null;

  loading = false;
  loadingUsers = false;
  error = '';

  toastVisible = false;
  toastMessage = '';
  toastType: TipoToast = 'info';

  constructor(
    private reportService: AttendanceReportService,
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

    this.dateFrom =
      `${this.today.substring(0, 7)}-01`;

    this.dateTo =
      this.today;

    this.loadUsers();
    this.loadStatistics();
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
  // CARGAR USUARIOS
  // ====================================================

  loadUsers(): void {
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
  // CARGAR ESTADÍSTICAS
  // ====================================================

  loadStatistics(): void {
    if (!this.dateFrom || !this.dateTo) {
      this.error =
        'Seleccioná las dos fechas del período.';
      return;
    }

    if (this.dateFrom > this.dateTo) {
      this.error =
        'La fecha desde no puede ser posterior a la fecha hasta.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.reportService
      .getStatistics({
        fechaDesde: this.dateFrom,
        fechaHasta: this.dateTo,
        usuarioId: this.selectedUserId,
        role: this.selectedRole
      })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: statistics => {
          this.statistics = statistics;
        },
        error: error => {
          this.statistics = null;

          this.error =
            error.error?.mensaje ||
            'No fue posible obtener las estadísticas.';

          this.showToast(
            this.error,
            'error'
          );
        }
      });
  }

  // ====================================================
  // FILTROS
  // ====================================================

  applyFilters(): void {
    this.loadStatistics();
  }

  clearFilters(): void {
    this.dateFrom =
      `${this.today.substring(0, 7)}-01`;

    this.dateTo =
      this.today;

    this.selectedUserId = null;
    this.selectedRole = null;

    this.loadStatistics();
  }

  // ====================================================
  // ESTADÍSTICAS POR ROL
  // ====================================================

  getRoleLabel(
    role: ReportableRole
  ): string {
    return role === 'supervisor'
      ? 'Supervisores'
      : 'Empleados';
  }

  getRoleIcon(
    role: ReportableRole
  ): string {
    return role === 'supervisor'
      ? 'bi-person-badge'
      : 'bi-people';
  }

  getRoleClass(
    role: ReportableRole
  ): string {
    return role === 'supervisor'
      ? 'supervisor-role'
      : 'employee-role';
  }

  getRoleStatistics(
    role: ReportableRole
  ): AttendanceStatisticsByRole | null {
    return this.statistics
      ?.por_rol.find(
        item => item.role === role
      ) || null;
  }

  // ====================================================
  // RANKING POR USUARIO
  // ====================================================

  get sortedUsers():
    AttendanceStatisticsByUser[] {
    if (!this.statistics) {
      return [];
    }

    return [
      ...this.statistics.por_usuario
    ].sort((userA, userB) => {
      const percentageDifference =
        userB.resumen
          .porcentaje_asistencia -
        userA.resumen
          .porcentaje_asistencia;

      if (percentageDifference !== 0) {
        return percentageDifference;
      }

      return (
        userB.resumen.horas_totales -
        userA.resumen.horas_totales
      );
    });
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

  // ====================================================
  // EVOLUCIÓN DIARIA
  // ====================================================

  getDailyPercentage(
    item: DailyAttendanceStatistics
  ): number {
    return this.normalizePercentage(
      item.resumen
        .porcentaje_asistencia
    );
  }

  // ====================================================
  // MODALIDADES
  // ====================================================

  getModalityLabel(
    modality: 'PRESENCIAL' | 'HOME'
  ): string {
    return modality === 'HOME'
      ? 'Home'
      : 'Presencial';
  }

  getModalityColor(
    modality: 'PRESENCIAL' | 'HOME'
  ): string {
    return modality === 'HOME'
      ? '#7c3aed'
      : '#0ea5e9';
  }

  getModalityTotal(
    item: AttendanceStatisticsByModality
  ): number {
    return item.resumen
      .registros_programados;
  }

  getModalityPercentage(
    modality: 'PRESENCIAL' | 'HOME'
  ): number {
    if (!this.statistics) {
      return 0;
    }

    const total =
      this.statistics.por_modalidad
        .reduce(
          (sum, item) =>
            sum +
            this.getModalityTotal(item),
          0
        );

    if (total === 0) {
      return 0;
    }

    const item =
      this.statistics.por_modalidad
        .find(
          group =>
            group.modalidad === modality
        );

    const modalityTotal =
      item
        ? this.getModalityTotal(item)
        : 0;

    return Number(
      (
        modalityTotal /
        total *
        100
      ).toFixed(2)
    );
  }

  getModalityChartBackground(): string {
    const homePercentage =
      this.getModalityPercentage('HOME');

    return (
      `conic-gradient(` +
      `#7c3aed 0% ${homePercentage}%, ` +
      `#0ea5e9 ${homePercentage}% 100%)`
    );
  }

  // ====================================================
  // BARRAS Y PORCENTAJES
  // ====================================================

  normalizePercentage(
    value: number
  ): number {
    const numberValue =
      Number(value || 0);

    return Math.min(
      100,
      Math.max(
        0,
        numberValue
      )
    );
  }

  getPercentageWidth(
    value: number
  ): string {
    return `${
      this.normalizePercentage(value)
    }%`;
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

    if (!year || !month || !day) {
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
        month - 1,
        day
      )
    );
  }

  formatHours(hours: number): string {
    return `${Number(
      hours || 0
    ).toFixed(2)} h`;
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