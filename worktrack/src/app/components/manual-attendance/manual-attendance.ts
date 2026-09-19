import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Toast, TipoToast } from '../toast/toast';
import {
  ManualAttendanceContext, ManualAttendanceRecord, ManualAttendanceRequest,
  ManualAttendanceUser, ManualContingency, ManualExitCompletionRequest
} from '../../models/manual-attendance.model';
import { ManualAttendanceService } from '../../services/manual-attendance.service';
import { Modal } from '../modal/modal';


@Component({
  selector: 'app-manual-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, Toast, Modal],
  templateUrl: './manual-attendance.html',
  styleUrl: './manual-attendance.css'
})
export class ManualAttendance implements OnInit {
  @Input() readOnly = false;

  private readonly service = inject(ManualAttendanceService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  private contextRequestId = 0;

  readonly contingencies: { value: ManualContingency; label: string }[] = [
    { value: 'QR_NO_DISPONIBLE', label: 'QR no disponible' },
    { value: 'PROBLEMA_CONECTIVIDAD', label: 'Problema de conectividad' },
    { value: 'SIN_CELULAR', label: 'Empleado sin celular' },
    { value: 'FALLA_CAMARA_LECTOR', label: 'Falla de cámara o lector' },
    { value: 'OTRA', label: 'Otra contingencia' }
  ];

  users: ManualAttendanceUser[] = [];
  records: ManualAttendanceRecord[] = [];
  userId: number | null = null;
  context: ManualAttendanceContext | null = null;
  entryTime = '';
  exitTime = '';
  contingency: ManualContingency | '' = '';
  reason = '';
  pendingRecord: ManualAttendanceRecord | null = null;
  pendingExitTime = '';
  pendingExitContingency: ManualContingency | '' = '';
  pendingExitReason = '';
  completingExit = false;

  loadingUsers = false;
  loadingContext = false;
  loadingRecords = false;
  saving = false;
  contextError = '';
  recordsError = '';
  toastMessage = '';
  toastType: TipoToast = 'info';

  ngOnInit(): void {
    if (typeof window === 'undefined') return;
    if (!this.readOnly) this.loadUsers();
    this.loadRecords();
  }

  get action(): ManualAttendanceContext['accion_disponible'] {
    return this.context?.accion_disponible ?? null;
  }

  get displayDate(): string {
    return this.formatDate(this.context?.fecha ?? this.argentinaNow().date);
  }

  get blockingReason(): string {
    if (this.readOnly || this.saving) return '';
    if (!this.userId) return 'Seleccioná una persona.';
    if (this.loadingContext) return 'Consultando la asistencia de hoy...';
    if (!this.context) return this.contextError || 'No se pudo consultar la asistencia.';

    const now = this.argentinaNow();

    if (this.context.fecha !== now.date) {
      return 'La fecha cambió. Volvé a seleccionar a la persona.';
    }
    if (!this.action) {
      return 'Esta persona ya tiene su asistencia completa de hoy.';
    }
    if (!this.timePattern.test(this.entryTime)) {
      return 'Indicá una hora de ingreso válida.';
    }
    if (this.entryTime > now.time) {
      return 'La hora de ingreso no puede ser futura.';
    }
    if (this.action === 'COMPLETAR_SALIDA' && !this.exitTime) {
      return 'Indicá la hora de egreso.';
    }
    if (this.exitTime && !this.timePattern.test(this.exitTime)) {
      return 'Indicá una hora de egreso válida.';
    }
    if (this.exitTime && this.exitTime > now.time) {
      return 'La hora de egreso no puede ser futura.';
    }
    if (this.exitTime && this.exitTime <= this.entryTime) {
      return 'El egreso debe ser posterior al ingreso.';
    }
    if (!this.contingency) {
      return 'Seleccioná una contingencia.';
    }

    const length = this.reason.trim().length;
    if (length < 10 || length > 500) {
      return 'El motivo debe tener entre 10 y 500 caracteres.';
    }

    return '';
  }

  get canRegister(): boolean {
    return !this.readOnly && !this.saving && !this.blockingReason;
  }

  selectUser(value: number | null): void {
    if (this.readOnly) return;

    this.userId = value;
    this.context = null;
    this.contextError = '';
    this.entryTime = '';
    this.exitTime = '';

    const requestId = ++this.contextRequestId;
    this.loadingContext = value !== null;
    if (value !== null) this.loadContext(value, requestId);
  }

  openExitCompletion(record: ManualAttendanceRecord): void {
    if (this.readOnly || record.hora_salida) return;

    this.pendingRecord = record;
    this.pendingExitTime = '';
    this.pendingExitContingency = '';
    this.pendingExitReason = '';
  }

  closeExitCompletion(): void {
    if (this.completingExit) return;

    this.pendingRecord = null;
    this.pendingExitTime = '';
    this.pendingExitContingency = '';
    this.pendingExitReason = '';
  }

  get pendingExitValidation(): string {
    if (!this.pendingRecord) return '';

    if (!this.timePattern.test(this.pendingExitTime)) {
      return 'Indicá una hora de egreso válida.';
    }

    const entryTime = this.pendingRecord.hora_entrada.slice(0, 5);

    if (this.pendingExitTime <= entryTime) {
      return 'El egreso debe ser posterior al ingreso.';
    }

    const now = this.argentinaNow();

    if (this.pendingRecord.fecha > now.date) {
      return 'No se puede completar una asistencia futura.';
    }

    if (
      this.pendingRecord.fecha === now.date &&
      this.pendingExitTime > now.time
    ) {
      return 'La hora de egreso no puede ser futura.';
    }

    if (!this.pendingExitContingency) {
      return 'Seleccioná una contingencia.';
    }

    const length = this.pendingExitReason.trim().length;

    if (length < 10 || length > 500) {
      return 'El motivo debe tener entre 10 y 500 caracteres.';
    }

    return '';
  }

  get canCompleteExit(): boolean {
    return !!this.pendingRecord &&
      !this.readOnly &&
      !this.completingExit &&
      !this.pendingExitValidation;
  }


  register(): void {
    if (
      !this.canRegister || !this.userId ||
      !this.context || !this.contingency
    ) return;

    const data: ManualAttendanceRequest = {
      usuario_id: this.userId,
      fecha: this.context.fecha,
      hora_salida: this.exitTime || null,
      contingencia: this.contingency,
      motivo: this.reason.trim()
    };

    if (this.action === 'CREAR') {
      data.hora_entrada = this.entryTime;
    }

    this.saving = true;
    this.service.register(data).pipe(
      finalize(() => {
        this.saving = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: response => {
        this.notify(
          response.mensaje || 'Asistencia registrada correctamente.',
          'success'
        );
        this.contextRequestId++;
        this.userId = null;
        this.context = null;
        this.loadingContext = false;
        this.entryTime = '';
        this.exitTime = '';
        this.contingency = '';
        this.reason = '';
        this.loadRecords();
      },
      error: error => {
        this.notify(
          error.error?.mensaje ||
          error.error?.message ||
          'No se pudo registrar la asistencia.',
          'error'
        );
      }
    });
  }

  completePendingExit(): void {
    if (
      !this.canCompleteExit ||
      !this.pendingRecord ||
      !this.pendingExitContingency
    ) return;

    const attendanceId = this.pendingRecord.asistencia_id;

    const data: ManualExitCompletionRequest = {
      hora_salida: this.pendingExitTime,
      contingencia: this.pendingExitContingency,
      motivo: this.pendingExitReason.trim()
    };

    this.completingExit = true;

    this.service.completeExit(attendanceId, data).pipe(
      finalize(() => {
        this.completingExit = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: response => {
        this.pendingRecord = null;
        this.pendingExitTime = '';
        this.pendingExitContingency = '';
        this.pendingExitReason = '';

        this.notify(
          response.mensaje || 'Salida manual registrada correctamente.',
          'success'
        );

        this.loadRecords();
      },
      error: error => {
        this.notify(
          error.error?.mensaje ||
          error.error?.message ||
          'No se pudo registrar la salida.',
          'error'
        );
      }
    });
  }

  loadRecords(): void {
    this.loadingRecords = true;
    this.recordsError = '';

    this.service.getRecords().pipe(
      finalize(() => {
        this.loadingRecords = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: records => this.records = records,
      error: error => {
        this.records = [];
        this.recordsError = error.error?.mensaje ||
          'No se pudieron cargar los registros manuales.';
      }
    });
  }

  formatDate(date: string): string {
    if (!date) return '';
    const [year, month, day] = date.slice(0, 10).split('-');
    return `${day}/${month}/${year}`;
  }

  formatTime(time: string | null): string {
    return time ? time.slice(0, 5) : 'Pendiente';
  }

  formatTimestamp(timestamp: string): string {
    if (!timestamp) return '';
    return `${this.formatDate(timestamp.slice(0, 10))} ${timestamp.slice(11, 16)}`;
  }

  initials(user: ManualAttendanceUser): string {
    return `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase();
  }

  contingencyLabel(value: ManualContingency): string {
    return this.contingencies.find(item => item.value === value)?.label ?? value;
  }

  private loadUsers(): void {
    this.loadingUsers = true;

    this.service.getUsers().pipe(
      finalize(() => {
        this.loadingUsers = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: users => this.users = users,
      error: error => {
        this.notify(
          error.error?.mensaje || 'No se pudieron cargar los usuarios.',
          'error'
        );
      }
    });
  }

  private loadContext(userId: number, requestId: number): void {
    this.service.getContext(userId).pipe(
      finalize(() => {
        if (requestId !== this.contextRequestId) return;
        this.loadingContext = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: context => {
        if (requestId !== this.contextRequestId) return;
        this.context = context;
        this.entryTime = context.asistencia?.hora_entrada?.slice(0, 5) ?? '';
        this.exitTime = context.asistencia?.hora_salida?.slice(0, 5) ?? '';
      },
      error: error => {
        if (requestId !== this.contextRequestId) return;
        this.contextError = error.error?.mensaje ||
          'No se pudo consultar el cronograma de hoy.';
      }
    });
  }

  private argentinaNow(): { date: string; time: string } {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(new Date());

    const value = (type: string) =>
      parts.find(part => part.type === type)?.value ?? '';

    return {
      date: `${value('year')}-${value('month')}-${value('day')}`,
      time: `${value('hour')}:${value('minute')}`
    };
  }

  private notify(message: string, type: TipoToast): void {
    this.toastMessage = message;
    this.toastType = type;
    this.cdr.detectChanges();
  }
}