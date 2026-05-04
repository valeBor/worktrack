export type Role = 'admin' | 'rrhh' | 'supervisor'| 'empleado';

export interface User {
    email: string;
    password?: string;
    role?: Role | null;
}