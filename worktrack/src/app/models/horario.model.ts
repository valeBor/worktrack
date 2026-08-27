import { Role } from './user.models';

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
  role?: Role;
}

export interface GuardarHorarioResponse {
  mensaje: string;
  cantidad: number;
  horarios: {
    id: number;
    dia_semana: string;
  }[];
}

export interface EliminarHorarioResponse {
  mensaje: string;
  cantidad: number;
}

export interface CronogramaAgrupado {
  usuario_id: number;
  nombre: string;
  apellido: string;
  email: string;
  role?: Role;
  horarios: Horario[];
}
