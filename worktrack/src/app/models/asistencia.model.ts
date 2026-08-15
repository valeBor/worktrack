export type TipoRegistro = 'entrada' | 'salida';

export interface RegistrarAsistenciaRequest {
  tipo: TipoRegistro;
  token?: string;
}

export interface RegistrarAsistenciaResponse {
  mensaje: string;
  accion?: string;
  asistenciaId?: number;
  fecha?: string;
  hora?: string;
  modalidad?: string;
  estado?: string;
  ipDetectada?: string;
}

export interface AsistenciaHoy {
  fecha: string;

  asistencia: {
    id: number;
    usuario_id: number;
    red_id: number | null;
    fecha: string;
    hora_entrada: string | null;
    hora_salida: string | null;
    tipo_asistencia: string;
    ubicacion: string | null;
    ip_detectada: string | null;
    estado: string;
  } | null;

  proximaAccion: TipoRegistro | null;
  jornadaCompletada: boolean;
}