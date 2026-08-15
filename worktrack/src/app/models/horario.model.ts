export interface HorarioNuevo {
  usuario_id: number | null;
  dias_semana: string[];
  hora_entrada: string;
  hora_salida: string;
  tolerancia_minutos: number;
  modalidad: 'PRESENCIAL' | 'HOME';
}

export interface Horario {
  id: number;
  usuario_id: number;
  dia_semana: string;
  hora_entrada: string;
  hora_salida: string;
  tolerancia_minutos: number;
  modalidad: 'PRESENCIAL' | 'HOME';

  nombre?: string;
  apellido?: string;
  email?: string;
}

export interface CrearHorarioResponse {
  mensaje: string;
  cantidad: number;

  horarios: {
    id: number;
    dia_semana: string;
  }[];
}