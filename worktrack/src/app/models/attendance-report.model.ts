import {TipoJustificativo} from './solicitud.model';

export type ReportableRole =
  | 'empleado'
  | 'supervisor';

export type AttendanceReportStatus =
  | 'PRESENTE'
  | 'TARDE'
  | 'AUSENTE'
  | 'FALTA_JUSTIFICADA'
  | 'PENDIENTE'
  | 'SIN_HORARIO';

export type AttendanceJourneyStatus =
  | 'SIN_REGISTRO'
  | 'EN_CURSO'
  | 'COMPLETA'
  | 'INCOMPLETA';

export type AttendanceReportModality =
  | 'PRESENCIAL'
  | 'HOME'
  | null;

// ======================================================
// USUARIO REPORTABLE
// ======================================================

export interface ReportableUser {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  estado: boolean;
  role: ReportableRole;
}

// ======================================================
// HORARIO ESPERADO
// ======================================================

export interface ExpectedAttendanceSchedule {
  hora_entrada: string;
  hora_salida: string;
  modalidad: Exclude<
    AttendanceReportModality,
    null
  >;
  tolerancia_minutos: number;
}

// ======================================================
// REGISTRO DE ASISTENCIA
// ======================================================

export interface AttendanceReportRecord {
  fecha: string;
  dia_semana: string;
  usuario: ReportableUser;
  estado: AttendanceReportStatus;
  estado_jornada: AttendanceJourneyStatus;
  programado: boolean;
  hora_entrada: string | null;
  hora_salida: string | null;
  horas_trabajadas: number;
  modalidad: AttendanceReportModality;
  ubicacion: string | null;
  cambio_horario: boolean;
  solicitud_cambio_id: number | null;
  falta_justificada: boolean;
  justificacion_id: number | null;
  tipo_justificativo: TipoJustificativo | null;
  tipo_justificativo_nombre: string | null;
  motivo_justificacion: string | null;
  horario_esperado: ExpectedAttendanceSchedule | null;
}

// ======================================================
// RESUMEN
// ======================================================

export interface AttendanceReportSummary {
  total_usuarios: number;
  registros_programados: number;
  registros_presentes: number;
  ausencias: number;
  faltas_justificadas: number;
  tardanzas: number;
  pendientes: number;
  sin_horario: number;
  jornadas_incompletas: number;
  horas_totales: number;
  promedio_horas_dia: number;
  porcentaje_asistencia: number;
}

// ======================================================
// REPORTE DIARIO
// ======================================================

export interface DailyAttendanceReport {
  fecha: string;
  dia_semana: string;
  generado_en: string;
  resumen: AttendanceReportSummary;
  registros: AttendanceReportRecord[];
}

// ======================================================
// FILTROS DEL HISTORIAL
// ======================================================

export interface AttendanceHistoryQuery {
  fechaDesde?: string;
  fechaHasta?: string;
  usuarioId?: number | null;
  role?: ReportableRole | null;
  estado?: AttendanceReportStatus | null;
}

// ======================================================
// HISTORIAL GLOBAL
// ======================================================

export interface GlobalAttendanceHistory {
  periodo: {
    fecha_desde: string;
    fecha_hasta: string;
  };

  filtros: {
    usuario_id: number | null;
    role: ReportableRole | null;
    estado: AttendanceReportStatus | null;
  };

  total_registros: number;
  resumen: AttendanceReportSummary;
  registros: AttendanceReportRecord[];
}

// ======================================================
// FILTROS DE ESTADÍSTICAS
// ======================================================

export interface AttendanceStatisticsQuery {
  fechaDesde?: string;
  fechaHasta?: string;
  usuarioId?: number | null;
  role?: ReportableRole | null;
}

// ======================================================
// ESTADÍSTICAS AGRUPADAS
// ======================================================

export interface AttendanceStatisticsByRole {
  role: ReportableRole;
  resumen: AttendanceReportSummary;
}

export interface AttendanceStatisticsByUser {
  usuario: ReportableUser;
  resumen: AttendanceReportSummary;
}

export interface DailyAttendanceStatistics {
  fecha: string;
  dia_semana: string;
  resumen: AttendanceReportSummary;
}

export interface AttendanceStatisticsByModality {
  modalidad: Exclude<
    AttendanceReportModality,
    null
  >;
  resumen: AttendanceReportSummary;
}

// ======================================================
// RESPUESTA DE ESTADÍSTICAS
// ======================================================

export interface AttendanceStatistics {
  periodo: {
    fecha_desde: string;
    fecha_hasta: string;
  };

  filtros: {
    usuario_id: number | null;
    role: ReportableRole | null;
  };

  resumen: AttendanceReportSummary;
  por_rol: AttendanceStatisticsByRole[];
  por_usuario: AttendanceStatisticsByUser[];
  evolucion_diaria: DailyAttendanceStatistics[];
  por_modalidad: AttendanceStatisticsByModality[];
}