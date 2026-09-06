import { Role } from './user.models';

export type PeriodoHistorial =
  | 'mes_actual'
  | 'mes_anterior'
  | 'todos';

export type EstadoHistorial =
  | 'PRESENTE'
  | 'TARDE'
  | 'AUSENTE'
  | 'PENDIENTE'
  | null;

export type EstadoJornada =
  | 'SIN_REGISTRO'
  | 'EN_CURSO'
  | 'COMPLETA'
  | 'INCOMPLETA';

export type ModalidadHistorial =
  | 'PRESENCIAL'
  | 'HOME'
  | null;

// ======================================================
// USUARIO DEL HISTORIAL
// ======================================================

export interface UsuarioHistorial {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  estado: boolean;
  role: Role;
}

// ======================================================
// USUARIO GESTIONABLE
// ======================================================

export interface UsuarioHistorialGestionable
  extends UsuarioHistorial {
  rol_id: number;
}

// ======================================================
// PERÍODO
// ======================================================

export interface PeriodoHistorialDetalle {
  tipo: PeriodoHistorial;
  fecha_desde: string;
  fecha_hasta: string;
  primera_asistencia: string | null;
  primera_vigencia: string | null;
  primera_solicitud_aprobada: string | null;
}

// ======================================================
// RESUMEN
// ======================================================

export interface ResumenHistorial {
  dias_programados: number;
  dias_presentes: number;
  horas_totales: number;
  llegadas_tarde: number;
  ausencias: number;
  registros_incompletos: number;
  promedio_horas_dia: number;
  porcentaje_asistencia: number;
}

// ======================================================
// HORARIO ESPERADO
// ======================================================

export interface HorarioEsperadoHistorial {
  hora_entrada: string;
  hora_salida: string;
  modalidad: Exclude<ModalidadHistorial, null>;
  tolerancia_minutos: number;
}

// ======================================================
// REGISTRO DIARIO
// ======================================================

export interface RegistroHistorial {
  fecha: string;
  dia_semana: string;
  estado: EstadoHistorial;
  estado_jornada: EstadoJornada;
  programado: boolean;
  hora_entrada: string | null;
  hora_salida: string | null;
  horas_trabajadas: number;
  modalidad: ModalidadHistorial;
  cambio_horario: boolean;
  solicitud_cambio_id: number | null;
  horario_esperado: HorarioEsperadoHistorial | null;
}

// ======================================================
// RESPUESTA COMPLETA
// ======================================================

export interface HistorialAsistencia {
  usuario: UsuarioHistorial;
  periodo: PeriodoHistorialDetalle;
  resumen: ResumenHistorial;
  registros: RegistroHistorial[];
}