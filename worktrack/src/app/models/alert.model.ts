export type AlertType =
  | 'TARDANZA'
  | 'AUSENCIA'
  | 'JORNADA_INCOMPLETA'
  | 'SIN_CRONOGRAMA'
  | 'ASISTENCIA_BAJA';

export type AlertSeverity = 'ALTA' | 'MEDIA';
export type AlertScope = 'PROPIO' | 'EQUIPO' | 'GLOBAL';

export interface AlertUser {
  id: number;
  nombre: string;
  apellido: string;
  role: 'empleado' | 'supervisor';
}

export interface AlertItem {
  id: string;
  tipo: AlertType;
  severidad: AlertSeverity;
  titulo: string;
  mensaje: string;
  fecha: string;
  ambito: AlertScope;
  usuario: AlertUser;
  porcentaje?: number;
  jornadas_evaluadas?: number;
}

export interface AlertListResponse {
  pagina: number;
  limite: number;
  total: number;
  total_paginas: number;
  generado_en: string;
  alertas: AlertItem[];
}