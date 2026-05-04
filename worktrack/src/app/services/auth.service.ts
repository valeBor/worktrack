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

  // 🔐 LOGIN
  login(user: User): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/login`, user);
  }

  // 💾 GUARDAR SESIÓN
  saveUser(data: AuthResponse) {
    localStorage.setItem('user', JSON.stringify(data));
  }

  // 📥 OBTENER USUARIO
  getUser(): AuthResponse | null {
    return JSON.parse(localStorage.getItem('user') || 'null');
  }

  // 🚪 LOGOUT
  logout() {
    localStorage.removeItem('user');
  }

  // ✅ SABER SI ESTÁ LOGUEADO
  isLoggedIn(): boolean {
    return !!localStorage.getItem('user');
  }
}