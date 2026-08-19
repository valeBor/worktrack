import { Injectable } from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

import {
  User
} from '../models/user.models';

import {
  AuthResponse
} from '../models/auth-response.model';

import {
  environment
} from '../../environments/environment';


// ======================================================
// RESPUESTA SIMPLE DEL BACKEND
// ======================================================

interface MessageResponse {

  message: string;

}


// ======================================================
// DATOS PARA SOLICITAR RECUPERACIÓN
// ======================================================

interface ForgotPasswordData {

  email: string;

  turnstileToken: string;

}


// ======================================================
// DATOS PARA RESTABLECER CONTRASEÑA
// ======================================================

interface ResetPasswordData {

  token: string;

  newPassword: string;

  confirmPassword: string;

}


@Injectable({

  providedIn: 'root'

})

export class AuthService {


  // La URL ya no está escrita directamente.
  //
  // Desarrollo:
  // http://localhost:3000/api/auth
  //
  // Producción:
  // URL del backend desplegado.
  private api =
    `${environment.apiUrl}/auth`;


  constructor(
    private http: HttpClient
  ) {}


  // ====================================================
  // LOGIN
  // ====================================================

  login(
    user: User
  ): Observable<AuthResponse> {

    return this.http.post<AuthResponse>(

      `${this.api}/login`,

      user

    );

  }


  // ====================================================
  // SOLICITAR RECUPERACIÓN DE CONTRASEÑA
  // ====================================================

  forgotPassword(

    data: ForgotPasswordData

  ): Observable<MessageResponse> {

    return this.http.post<MessageResponse>(

      `${this.api}/forgot-password`,

      data

    );

  }


  // ====================================================
  // GUARDAR CONTRASEÑA NUEVA
  // ====================================================

  resetPassword(

    data: ResetPasswordData

  ): Observable<MessageResponse> {

    return this.http.post<MessageResponse>(

      `${this.api}/reset-password`,

      data

    );

  }


  // ====================================================
  // GUARDAR SESIÓN
  // ====================================================

  saveUser(
    res: AuthResponse
  ): void {

    // Evita errores durante SSR.
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


  // ====================================================
  // OBTENER USUARIO LOGUEADO
  // ====================================================

  getUser():
    AuthResponse['user'] | null {

    if (typeof window === 'undefined') {

      return null;

    }


    return JSON.parse(

      localStorage.getItem('user') ||
      'null'

    );

  }


  // ====================================================
  // OBTENER TOKEN
  // ====================================================

  getToken(): string | null {

    if (typeof window === 'undefined') {

      return null;

    }


    return localStorage.getItem('token');

  }


  // ====================================================
  // OBTENER ROL
  // ====================================================

  getRole(): string | null {

    if (typeof window === 'undefined') {

      return null;

    }


    return localStorage.getItem('role');

  }


  // ====================================================
  // CERRAR SESIÓN
  // ====================================================

  logout(): void {

    if (typeof window === 'undefined') {

      return;

    }


    localStorage.removeItem('user');

    localStorage.removeItem('token');

    localStorage.removeItem('role');

  }


  // ====================================================
  // SABER SI EXISTE UNA SESIÓN
  // ====================================================

  isLoggedIn(): boolean {

    if (typeof window === 'undefined') {

      return false;

    }


    return !!localStorage.getItem('token');

  }

}