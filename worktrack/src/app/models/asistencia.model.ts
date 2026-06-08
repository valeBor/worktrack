export type TipoRegistro = 'entrada' | 'salida';

export interface RegistrarAsistenciaRequest {
  token: string;
  tipo: TipoRegistro;
}

export interface RegistrarAsistenciaResponse {
  mensaje: string;
}