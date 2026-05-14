import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../../../services/auth.service';
import { AuthResponse } from '../../../models/auth-response.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  error = '';
  message = '';

  selectedRole: string | null = null;

  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {

    this.loginForm = this.fb.group({

      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
        ]
      ],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(20)
        ]
      ]

    });

  }

  selectRole(role: string) {
    this.selectedRole = role;
  }

  onSubmit() {

    this.error = '';
    this.message = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.auth.login(this.loginForm.value).subscribe({

      next: (res: AuthResponse) => {

        this.auth.saveUser(res);

        localStorage.setItem('role', res.role);

        this.message = 'Login correcto';

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