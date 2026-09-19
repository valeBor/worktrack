import {Role} from './user.models';

export type SolicitudEstado = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export type SolicitudTipo =
  | 'CAMBIO_HORARIO'
  | 'JUSTIFICACION_INASISTENCIA';

export type TipoJustificativo =
  | 'CERTIFICADO_MEDICO'
  | 'CERTIFICADO_ESTUDIO'
  | 'EMERGENCIA_FAMILIAR'
  | 'OTRO';

export type ModalidadHorario = 'PRESENCIAL' | 'HOME';

export interface SolicitudCambioHorario {
  id: number;
  usuario_id: number;
  tipo: SolicitudTipo;
  estado: SolicitudEstado;

  fecha_solicitada: string | null;
  hora_entrada_actual: string | null;
  hora_salida_actual: string | null;
  modalidad_actual: ModalidadHorario | null;
  tolerancia_actual: number | null;
  hora_entrada_solicitada: string | null;
  hora_salida_solicitada: string | null;
  modalidad_solicitada: ModalidadHorario | null;

  motivo: string;
  fecha_inasistencia: string | null;
  tipo_justificativo_id?: number | null;
  tipo_justificativo?: TipoJustificativo | null;
  tipo_justificativo_nombre?: string | null;
  requiere_archivo?: boolean | number | null;

  archivo_id?: number | null;
  archivo_nombre_original?: string | null;
  archivo_mime_type?: string | null;
  archivo_tamanio_bytes?: number | null;

  creada_en: string;
  respuesta: string | null;
  resuelto_por: number | null;
  resuelta_en: string | null;

  responsable_nombre?: string | null;
  responsable_apellido?: string | null;
  responsable_role?: Role | null;

  usuario_nombre?: string;
  usuario_apellido?: string;
  usuario_email?: string;
  usuario_role?: Role;
}

export interface NuevaSolicitudCambioHorario {
  fecha_solicitada: string;
  hora_entrada_solicitada: string;
  hora_salida_solicitada: string;
  modalidad_solicitada: ModalidadHorario;
  motivo: string;
}

export interface HorarioActualFecha {
  fecha_solicitada: string;
  dia_semana: string;
  horario_actual: {
    hora_entrada: string;
    hora_salida: string;
    modalidad: ModalidadHorario;
    tolerancia_minutos: number;
  };
}

export interface SolicitudCreada {
  id: number;
  usuario_id: number;
  tipo: 'CAMBIO_HORARIO';
  estado: 'PENDIENTE';
  fecha_solicitada: string;
  hora_entrada_actual: string;
  hora_salida_actual: string;
  modalidad_actual: ModalidadHorario;
  tolerancia_actual: number;
  hora_entrada_solicitada: string;
  hora_salida_solicitada: string;
  modalidad_solicitada: ModalidadHorario;
  motivo: string;
}

export interface CrearSolicitudResponse {
  mensaje: string;
  solicitud: SolicitudCreada;
}

export interface ResolverSolicitudRequest {
  estado: 'APROBADA' | 'RECHAZADA';
  respuesta?: string;
}

export interface ResponsableSolicitud {
  nombre: string;
  apellido: string;
  role: Role;
}

export interface ResolverSolicitudResponse {
  mensaje: string;
  solicitud: {
    id: number;
    estado: 'APROBADA' | 'RECHAZADA';
    respuesta: string | null;
    resuelto_por: number;
    responsable: ResponsableSolicitud;
    resuelta_en: string;
  };
}

export interface GrupoSolicitudes {
  estado: SolicitudEstado;
  titulo: string;
  icono: string;
  solicitudes: SolicitudCambioHorario[];
}

export interface SolicitudJustificativo {
  id: number;
  usuario_id: number;
  tipo: 'JUSTIFICACION_INASISTENCIA';
  estado: SolicitudEstado;
  fecha_inasistencia: string;
  tipo_justificativo_id?: number;
  tipo_justificativo: TipoJustificativo;
  tipo_justificativo_nombre?: string;
  requiere_archivo?: boolean | number;
  motivo: string;

  archivo_id?: number | null;
  archivo_nombre_original?: string | null;
  archivo_mime_type?: string | null;
  archivo_tamanio_bytes?: number | null;

  creada_en: string;
  respuesta: string | null;
  resuelto_por: number | null;
  resuelta_en: string | null;

  responsable_nombre?: string | null;
  responsable_apellido?: string | null;
  responsable_role?: Role | null;

  usuario_nombre?: string;
  usuario_apellido?: string;
  usuario_email?: string;
  usuario_role?: Role;
}

export interface NuevaSolicitudJustificativo {
  fecha_inasistencia: string;
  tipo_justificativo: TipoJustificativo;
  motivo: string;
}

export interface CrearJustificativoResponse {
  mensaje: string;
  solicitud: SolicitudJustificativo;
}