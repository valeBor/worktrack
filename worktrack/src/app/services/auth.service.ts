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
  saveUser(res: AuthResponse): void {

    // Evita error con SSR
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem(
      'token',
      res.token
    );

    localStorage.setItem(
      'user',
      JSON.stringify(res.user)
    );

    localStorage.setItem(
      'role',
      res.user.role
    );

  }



  // OBTENER USUARIO LOGUEADO
  getUser(): AuthResponse['user'] | null {

    // Evita error con SSR
    if (typeof window === 'undefined') {
      return null;
    }

    return JSON.parse(
      localStorage.getItem('user') || 'null'
    );

  }



  // OBTENER TOKEN
  getToken(): string | null {

    if (typeof window === 'undefined') {
      return null;
    }

    return localStorage.getItem('token');

  }



  // OBTENER ROL
  getRole(): string | null {

    if (typeof window === 'undefined') {
      return null;
    }

    return localStorage.getItem('role');

  }



  // LOGOUT
  logout(): void {

    if (typeof window === 'undefined') {
      return;
    }

    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('role');

  }



  // SABER SI ESTA LOGUEADO
  isLoggedIn(): boolean {

    if (typeof window === 'undefined') {
      return false;
    }

    return !!localStorage.getItem('token');

  }

}