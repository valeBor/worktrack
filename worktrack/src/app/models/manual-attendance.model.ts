export type ManualContingency =
  | 'QR_NO_DISPONIBLE'
  | 'PROBLEMA_CONECTIVIDAD'
  | 'SIN_CELULAR'
  | 'FALLA_CAMARA_LECTOR'
  | 'OTRA';

export interface ManualAttendanceUser {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  role: 'empleado' | 'supervisor';
}

export interface ManualAttendanceContext {
  fecha: string;
  usuario: ManualAttendanceUser;
  horario: {
    hora_entrada: string;
    hora_salida: string;
    modalidad: 'PRESENCIAL' | 'HOME';
    tolerancia_minutos: number;
    origen_horario: string;
    solicitud_cambio_id: number | null;
  };
  asistencia: {
    id: number;
    hora_entrada: string;
    hora_salida: string | null;
    tipo_asistencia: 'PRESENCIAL' | 'HOME';
    estado: 'PRESENTE' | 'TARDE';
  } | null;
  accion_disponible: 'CREAR' | 'COMPLETAR_SALIDA' | null;
}

export interface ManualAttendanceRequest {
  usuario_id: number;
  fecha: string;
  hora_entrada?: string;
  hora_salida: string | null;
  contingencia: ManualContingency;
  motivo: string;
}

export interface ManualExitCompletionRequest {
  hora_salida: string;
  contingencia: ManualContingency;
  motivo: string;
}

export interface ManualAttendanceResponse {
  mensaje: string;
  asistencia_id: number;
  accion: 'CREACION_MANUAL' | 'SALIDA_MANUAL';
}

export interface ManualAttendanceEvent {
  id: number;
  accion: string;
  contingencia: ManualContingency;
  motivo: string;
  realizado_por: number;
  responsable_nombre: string;
  responsable_apellido: string;
  registrada_en: string;
  hora_entrada_anterior: string | null;
  hora_salida_anterior: string | null;
  hora_entrada_nueva: string | null;
  hora_salida_nueva: string | null;
}

export interface ManualAttendanceRecord {
  asistencia_id: number;
  usuario: ManualAttendanceUser;
  fecha: string;
  hora_entrada: string;
  hora_salida: string | null;
  tipo_asistencia: 'PRESENCIAL' | 'HOME';
  estado: 'PRESENTE' | 'TARDE';
  origen_entrada: string;
  origen_salida: string | null;
  eventos: ManualAttendanceEvent[];
}