export type Role = 'admin' | 'rrhh' | 'supervisor'| 'empleado';

export interface User {
    id?: number;
    nombre: string;
    apellido: string;
    email: string;
    password?: string;
    estado: boolean;
    role?: Role | null;
}