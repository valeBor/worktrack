export type NotificationType =
  | 'SOLICITUD_CREADA'
  | 'SOLICITUD_APROBADA'
  | 'SOLICITUD_RECHAZADA'
  | 'CRONOGRAMA_ASIGNADO'
  | 'CRONOGRAMA_MODIFICADO'
  | 'CRONOGRAMA_FINALIZADO';

export interface NotificationItem {
  id: number;
  usuario_id: number;
  actor_id: number | null;
  tipo: NotificationType;
  titulo: string;
  mensaje: string;
  entidad_tipo: string | null;
  entidad_id: number | null;
  leido: boolean;
  creada_en: string;
  leida_en: string | null;
  actor_nombre?: string | null;
  actor_apellido?: string | null;
  actor_role?: string | null;
}

export interface NotificationListResponse {
  pagina: number;
  limite: number;
  total: number;
  total_paginas: number;
  total_no_leidas: number;
  solo_no_leidas: boolean;
  notificaciones: NotificationItem[];
}

export interface NotificationCountResponse {
  total_no_leidas: number;
}

export interface MarkNotificationResponse {
  mensaje: string;
  notificacion: NotificationItem;
}

export interface MarkAllNotificationsResponse {
  mensaje: string;
  cantidad_actualizada: number;
}
