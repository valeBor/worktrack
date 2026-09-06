import {ChangeDetectorRef,Component,Inject, OnInit, PLATFORM_ID} from '@angular/core';
import {CommonModule, isPlatformBrowser} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {finalize} from 'rxjs';
import {jsPDF} from 'jspdf';
import autoTable from 'jspdf-autotable';
import {Header} from '../../components/header/header';
import {AuthService} from '../../services/auth.service';
import {AttendanceHistoryService} from '../../services/attendance-history.service';
import {HistorialAsistencia,PeriodoHistorial,RegistroHistorial, UsuarioHistorialGestionable
} from '../../models/historial-asistencia.model';

@Component({
  selector: 'app-attendance-history',
  standalone: true,
  imports: [CommonModule,FormsModule, Header],
  templateUrl: './attendance-history.html',
  styleUrl: './attendance-history.css'
})
export class AttendanceHistory implements OnInit {
  isBrowser = false;

  history: HistorialAsistencia | null = null;
  manageableUsers: UsuarioHistorialGestionable[] = [];

  selectedPeriod: PeriodoHistorial = 'mes_actual';
  selectedUserId: number | null = null;

  canManageHistory = false;
  loadingHistory = false;
  loadingUsers = false;
  error = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private historyService: AttendanceHistoryService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }

    const user = this.authService.getUser();

    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.canManageHistory = [
      'supervisor',
      'rrhh',
      'admin'
    ].includes(
      String(user.role || '').toLowerCase()
    );

    this.loadHistory();

    if (this.canManageHistory) {
      this.loadManageableUsers();
    }
  }

  // ====================================================
  // CARGAR HISTORIAL
  // ====================================================

  loadHistory(): void {
    this.loadingHistory = true;
    this.error = '';

    const request$ =
      this.selectedUserId === null
        ? this.historyService.getMyHistory(
            this.selectedPeriod
          )
        : this.historyService.getUserHistory(
            this.selectedUserId,
            this.selectedPeriod
          );

    request$
      .pipe(
        finalize(() => {
          this.loadingHistory = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: history => {
          this.history = history;
        },
        error: err => {
          this.history = null;
          this.error =
            err.error?.mensaje ||
            'No fue posible obtener el historial de asistencia.';
        }
      });
  }

  // ====================================================
  // CARGAR USUARIOS GESTIONABLES
  // ====================================================

  loadManageableUsers(): void {
    this.loadingUsers = true;

    this.historyService
      .getManageableUsers()
      .pipe(
        finalize(() => {
          this.loadingUsers = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: users => {
          this.manageableUsers = users;
        },
        error: err => {
          this.manageableUsers = [];
          this.error =
            err.error?.mensaje ||
            'No fue posible obtener los usuarios disponibles.';
        }
      });
  }

  // ====================================================
  // CAMBIAR FILTROS
  // ====================================================

  onPeriodChange(): void {
    this.loadHistory();
  }

  onUserChange(): void {
    this.loadHistory();
  }

  // ====================================================
  // FORMATEAR FECHA
  // ====================================================

  formatDate(date: string): string {
    const [year, month, day] = String(date)
      .split('-')
      .map(Number);

    if (!year || !month || !day) {
      return date;
    }

    return new Intl.DateTimeFormat('es-AR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(
      new Date(year, month - 1, day)
    );
  }

  private formatShortDate(date: string): string {
    const [year, month, day] = String(date)
      .split('-')
      .map(Number);

    if (!year || !month || !day) {
      return date;
    }

    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(
      new Date(year, month - 1, day)
    );
  }

  // ====================================================
  // FORMATEAR HORA
  // ====================================================

  formatTime(time: string | null): string {
    return time
      ? time.substring(0, 5)
      : '--:--';
  }

  // ====================================================
  // FORMATEAR HORAS TRABAJADAS
  // ====================================================

  formatWorkedHours(hours: number): string {
    const formatted = Number(
      Number(hours || 0).toFixed(2)
    );

    return `${formatted} h`;
  }

  // ====================================================
  // ETIQUETA DEL ESTADO
  // ====================================================

  getStatusLabel(
    record: RegistroHistorial
  ): string {
    if (record.estado === 'PRESENTE') {
      return 'Presente';
    }

    if (record.estado === 'TARDE') {
      return 'Llegada tarde';
    }

    if (record.estado === 'AUSENTE') {
      return 'Ausente';
    }

    if (record.estado === 'PENDIENTE') {
      return 'Pendiente';
    }

    return 'Sin estado';
  }

  // ====================================================
  // CLASE DEL ESTADO
  // ====================================================

  getStatusClass(
    record: RegistroHistorial
  ): string {
    if (record.estado === 'PRESENTE') {
      return 'status-present';
    }

    if (record.estado === 'TARDE') {
      return 'status-late';
    }

    if (record.estado === 'AUSENTE') {
      return 'status-absent';
    }

    if (record.estado === 'PENDIENTE') {
      return 'status-pending';
    }

    return 'status-default';
  }

  // ====================================================
  // EXPORTAR HISTORIAL EN PDF
  // ====================================================

  exportHistory(): void {
    if (
      !this.isBrowser ||
      !this.history ||
      this.history.registros.length === 0
    ) {
      return;
    }

    const {
      usuario,
      periodo,
      resumen,
      registros
    } = this.history;

    const document = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth =
      document.internal.pageSize.getWidth();

    document.setProperties({
      title: 'Historial de asistencia',
      subject: 'Reporte de asistencia WorkTrack',
      author: 'WorkTrack',
      creator: 'WorkTrack'
    });

    // --------------------------------------------------
    // ENCABEZADO
    // --------------------------------------------------

    document.setFillColor(17, 24, 39);
    document.rect(
      0,
      0,
      pageWidth,
      20,
      'F'
    );

    document.setTextColor(255, 255, 255);
    document.setFont('helvetica', 'bold');
    document.setFontSize(18);
    document.text(
      'WorkTrack',
      14,
      13
    );

    document.setFontSize(13);
    document.text(
      'Historial de asistencia',
      pageWidth - 14,
      13,
      {
        align: 'right'
      }
    );

    // --------------------------------------------------
    // INFORMACIÓN DEL REPORTE
    // --------------------------------------------------

    document.setTextColor(15, 23, 42);
    document.setFont('helvetica', 'bold');
    document.setFontSize(11);

    document.text(
      `${usuario.nombre} ${usuario.apellido}`,
      14,
      29
    );

    document.setFont('helvetica', 'normal');
    document.setFontSize(9);

    document.text(
      `Rol: ${this.getRoleLabel(usuario.role)}`,
      14,
      35
    );

    document.text(
      `Periodo: ${this.formatShortDate(periodo.fecha_desde)} al ${this.formatShortDate(periodo.fecha_hasta)}`,
      75,
      35
    );

    document.text(
      `Generado: ${new Date().toLocaleString('es-AR')}`,
      pageWidth - 14,
      35,
      {
        align: 'right'
      }
    );

    // --------------------------------------------------
    // RESUMEN
    // --------------------------------------------------

    autoTable(document, {
      startY: 41,
      head: [[
        'Días programados',
        'Días presentes',
        'Horas totales',
        'Llegadas tarde',
        'Ausencias',
        'Incompletos',
        'Asistencia'
      ]],
      body: [[
        String(resumen.dias_programados),
        String(resumen.dias_presentes),
        this.formatWorkedHours(
          Number(resumen.horas_totales)
        ),
        String(resumen.llegadas_tarde),
        String(resumen.ausencias),
        String(resumen.registros_incompletos),
        `${Number(resumen.porcentaje_asistencia).toFixed(1)} %`
      ]],
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        halign: 'center',
        valign: 'middle',
        cellPadding: 2.5,
        textColor: [15, 23, 42],
        lineColor: [221, 228, 234],
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [10, 171, 101],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      bodyStyles: {
        fillColor: [240, 253, 244],
        fontStyle: 'bold'
      },
      margin: {
        left: 14,
        right: 14
      }
    });

    // --------------------------------------------------
    // DETALLE
    // --------------------------------------------------

    const detailRows = registros.map(
      record => [
        this.formatShortDate(record.fecha),
        this.capitalize(record.dia_semana),
        this.getStatusLabel(record),
        this.formatTime(record.hora_entrada),
        this.formatTime(record.hora_salida),
        this.formatWorkedHours(
          Number(record.horas_trabajadas)
        ),
        record.modalidad || 'N/D',
        record.cambio_horario ? 'Sí' : 'No'
      ]
    );

    autoTable(document, {
      startY: 61,
      head: [[
        'Fecha',
        'Día',
        'Estado',
        'Entrada',
        'Salida',
        'Horas trabajadas',
        'Modalidad',
        'Cambio de horario'
      ]],
      body: detailRows,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        valign: 'middle',
        cellPadding: 2.6,
        textColor: [30, 41, 59],
        lineColor: [221, 228, 234],
        lineWidth: 0.15
      },
      headStyles: {
        fillColor: [22, 48, 76],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: {
          halign: 'center',
          cellWidth: 27
        },
        1: {
          halign: 'center',
          cellWidth: 27
        },
        2: {
          halign: 'center',
          cellWidth: 32
        },
        3: {
          halign: 'center',
          cellWidth: 24
        },
        4: {
          halign: 'center',
          cellWidth: 24
        },
        5: {
          halign: 'center',
          cellWidth: 34
        },
        6: {
          halign: 'center',
          cellWidth: 30
        },
        7: {
          halign: 'center',
          cellWidth: 37
        }
      },
      margin: {
        left: 14,
        right: 14,
        bottom: 16
      }
    });

    // --------------------------------------------------
    // PIE DE PÁGINA
    // --------------------------------------------------

    const totalPages =
      document.getNumberOfPages();

    for (
      let page = 1;
      page <= totalPages;
      page++
    ) {
      document.setPage(page);

      const pageHeight =
        document.internal.pageSize.getHeight();

      document.setDrawColor(221, 228, 234);
      document.line(
        14,
        pageHeight - 11,
        pageWidth - 14,
        pageHeight - 11
      );

      document.setFont('helvetica', 'normal');
      document.setFontSize(8);
      document.setTextColor(100, 116, 139);

      document.text(
        'Reporte generado por WorkTrack',
        14,
        pageHeight - 6
      );

      document.text(
        `Página ${page} de ${totalPages}`,
        pageWidth - 14,
        pageHeight - 6,
        {
          align: 'right'
        }
      );
    }

    // --------------------------------------------------
    // DESCARGA
    // --------------------------------------------------

    const userName = this.sanitizeFileName(
      `${usuario.nombre}-${usuario.apellido}`
    );

    document.save(
      `historial-${userName}-${periodo.tipo}.pdf`
    );
  }

  // ====================================================
  // ETIQUETA DEL ROL
  // ====================================================

  private getRoleLabel(role: string): string {
    const normalizedRole =
      String(role || '').toLowerCase();

    if (normalizedRole === 'admin') {
      return 'Administrador';
    }

    if (normalizedRole === 'rrhh') {
      return 'Recursos Humanos';
    }

    if (normalizedRole === 'supervisor') {
      return 'Supervisor';
    }

    return 'Empleado';
  }

  // ====================================================
  // CAPITALIZAR TEXTO
  // ====================================================

  private capitalize(value: string): string {
    const text =
      String(value || '').trim();

    if (!text) {
      return '';
    }

    return (
      text.charAt(0).toUpperCase() +
      text.substring(1).toLowerCase()
    );
  }

  // ====================================================
  // NOMBRE SEGURO PARA EL ARCHIVO
  // ====================================================

  private sanitizeFileName(
    value: string
  ): string {
    return String(value || 'usuario')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }

  // ====================================================
  // TRACK BY
  // ====================================================

  trackByDate(
    index: number,
    record: RegistroHistorial
  ): string {
    return record.fecha;
  }
}