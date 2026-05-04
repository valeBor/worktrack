export interface AuthResponse{
message: string;
email: string;
role: 'admin' | 'rrhh' | 'supervisor'| 'empleado';

}