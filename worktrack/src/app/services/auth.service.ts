import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.models';
import { AuthResponse } from '../models/auth-response.model';

@Injectable({
  providedIn: 'root'
})

export class AuthService {

  private api = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) {}



  // LOGIN
  login(user: User): Observable<AuthResponse> {

    return this.http.post<AuthResponse>(
      `${this.api}/login`,
      user
    );

  }



  // GUARDAR SESION
  //no guarda toda la respuesta solo lo necesario

  saveUser(res: AuthResponse) {

  localStorage.setItem('token', res.token);

  localStorage.setItem('user', JSON.stringify(res.user));

  localStorage.setItem('role', res.user.role);

}



  // OBTENER USUARIO
  getUser(): AuthResponse | null {

    return JSON.parse(
      localStorage.getItem('user') || 'null'
    );

  }



  // OBTENER TOKEN
  getToken(): string | null {

    return localStorage.getItem('token');

  }



  // LOGOUT
  logout() {

    localStorage.removeItem('user');

    localStorage.removeItem('token');

  }



  // ESTA LOGUEADO
  isLoggedIn(): boolean {

    return !!localStorage.getItem('token');

  }

}