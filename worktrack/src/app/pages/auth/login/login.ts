import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../../../services/auth.service';
import { AuthResponse } from '../../../models/auth-response.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  // 📌 Datos del formulario (lo que se envía)
  user = {
    email: '',
    password: ''
  };

  // 🎨 SOLO UI (no se envía al backend)
  selectedRole: string | null = null;

  // 📢 Mensajes
  error: string = '';
  message: string = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  // 👉 Selección visual del rol
  selectRole(role: string) {
    this.selectedRole = role;
  }

  // 👉 Enviar login
  onSubmit() {

    this.error = '';
    this.message = '';

    if (!this.user.email || !this.user.password) {
      this.error = 'Completar todos los campos';
      return;
    }

    this.auth.login(this.user).subscribe({
      next: (res: AuthResponse) => {

        this.auth.saveUser(res);
        this.message = 'Login correcto';

        // 🔀 Redirección por rol REAL (backend)
        if (res.role === 'admin') {
          this.router.navigate(['/admin']);
        } else if (res.role === 'rrhh') {
          this.router.navigate(['/rrhh']);
        } else if (res.role === 'supervisor') {
          this.router.navigate(['/scanner']);
        } else {
          this.router.navigate(['/home']);
        }

      },
      error: (err) => {

        if (err.status === 404) {
          this.error = 'Usuario no existe';
        } else if (err.status === 401) {
          this.error = 'Contraseña incorrecta';
        } else {
          this.error = 'Error en el servidor';
        }

      }
    });
  }
}