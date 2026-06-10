export interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: number;
    email: string;
    nombre: string;
    apellido:string;
    role: 'admin' | 'rrhh' | 'supervisor' | 'empleado';
  };

}

/**la respuesta debe coincidir con la respuesta de backend,  */