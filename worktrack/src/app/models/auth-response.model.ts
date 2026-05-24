export interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: number;
    email: string;
    role: 'admin' | 'rrhh' | 'supervisor' | 'empleado';
  };

}

/**la respuesta debe coincidir con la respuesta de backend,  */