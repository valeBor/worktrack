import {Role} from './user.models';
// ======================================================
// TIPOS
// ======================================================

export type SolicitudEstado =
  | 'PENDIENTE'
  | 'APROBADA'
  | 'RECHAZADA';


export type SolicitudTipo =
  | 'CAMBIO_HORARIO'
  | 'JUSTIFICATIVO_FALTA';

export type TipoJustificativo =
  | 'CERTIFICADO_MEDICO'
  | 'EMERGENCIA_FAMILIAR'
  | 'OTRO_MOTIVO';

export type ModalidadHorario =
  | 'PRESENCIAL'
  | 'HOME';


// ======================================================
// SOLICITUD DE CAMBIO DE HORARIO
// ======================================================

export interface SolicitudCambioHorario {

  id: number;
  usuario_id: number;
  tipo: SolicitudTipo;
  estado: SolicitudEstado;
  fecha_solicitada: string;
  hora_entrada_actual: string;
  hora_salida_actual: string;
  modalidad_actual:
    ModalidadHorario;
  tolerancia_actual: number;
  hora_entrada_solicitada: string;
  hora_salida_solicitada: string;
  modalidad_solicitada: ModalidadHorario;
  motivo: string;
  creada_en: string;
  respuesta: string | null;
  resuelto_por: number | null;
  resuelta_en: string | null;

  
  // Campos propios del justificativo de falta.
  fecha_inasistencia?: string;
  tipo_justificativo?: TipoJustificativo;
  descripcion?: string;
  archivo_url?: string | null;


  // Responsable que aprobó o rechazó.
  responsable_nombre?: string | null;
  responsable_apellido?: string | null;
  responsable_role?: Role | null;

  // Datos incluidos al consultar pendientes.
  usuario_nombre?: string;
  usuario_apellido?:string;
  usuario_email?: string;
  usuario_role?: Role;
}


// ======================================================
// DATOS PARA CREAR UNA SOLICITUD
// ======================================================
//
// Angular solamente envía estos campos.
//
// usuario_id, tipo, estado y horario actual
// se obtienen y validan en el backend.
// ======================================================

export interface NuevaSolicitudCambioHorario {
  fecha_solicitada: string;
  hora_entrada_solicitada: string;
  hora_salida_solicitada: string;
  modalidad_solicitada: ModalidadHorario;
  motivo: string;
}

// ======================================================
// HORARIO ACTUAL PARA UNA FECHA
// ======================================================

export interface HorarioActualFecha {

  fecha_solicitada: string;
  dia_semana: string;
  horario_actual: {
    hora_entrada: string;
    hora_salida: string;
    modalidad:
      ModalidadHorario;
    tolerancia_minutos:
      number;
  };

}


// ======================================================
// SOLICITUD DEVUELTA AL CREAR
// ======================================================

export interface SolicitudCreada {

  id: number;
  usuario_id: number;
  tipo: SolicitudTipo;
  estado: 'PENDIENTE';
  fecha_solicitada: string;
  hora_entrada_actual: string;
  hora_salida_actual: string;
  hora_entrada_solicitada: string;
  hora_salida_solicitada: string;
  modalidad_solicitada: ModalidadHorario;
  modalidad_actual: ModalidadHorario;
  tolerancia_actual: number;
  motivo: string;
}


// ======================================================
// RESPUESTA AL CREAR
// ======================================================

export interface CrearSolicitudResponse {

  mensaje: string;
  solicitud: SolicitudCreada;
}


// ======================================================
// DATOS PARA APROBAR O RECHAZAR
// ======================================================

export interface ResolverSolicitudRequest {

  estado:
    | 'APROBADA'
    | 'RECHAZADA';

  respuesta?: string;

}


// ======================================================
// RESPONSABLE DE LA RESOLUCIÓN
// ======================================================

export interface ResponsableSolicitud {

  nombre: string;
  apellido: string;
  role: Role;
}


// ======================================================
// RESPUESTA AL RESOLVER
// ======================================================

export interface ResolverSolicitudResponse {

  mensaje: string;
  solicitud: {
    id: number;
    estado:
      | 'APROBADA'
      | 'RECHAZADA';
    respuesta:string | null;
    resuelto_por:number;
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

// SOLICITUD DE JUSTIFICATIVO DE FALTA

export interface SolicitudJustificativo {
  id: number;
  usuario_id: number;
  tipo: SolicitudTipo;
  tipo_justificativo: TipoJustificativo;
  estado: SolicitudEstado;
  fecha_inasistencia: string;
  descripcion: string;
  archivo_url: string | null;
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
  descripcion: string;
}

export interface CrearJustificativoResponse {
  mensaje: string;
  solicitud: SolicitudJustificativo;
}