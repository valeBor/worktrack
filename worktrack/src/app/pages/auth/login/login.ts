import { Component, Inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import { CommonModule, isPlatformBrowser } from '@angular/common';
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
export class Login implements AfterViewInit{

  error = '';
  message = '';

  siteKey = '0x4AAAAAADT44xp-EgoQPGPE'; // clave de turntile
  turnstileToken: string | null = null;

   isBrowser = false;

  selectedRole: string | null = null;

  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object 
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
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

   this.isBrowser = typeof window !== 'undefined';

    if (this.isBrowser) {
      (window as any)['onTurnstileSuccess'] = (token: string) => {
        this.turnstileToken = token;
  };
}
    // CAMBIO 2 cloudflare

  }

 ngAfterViewInit() {
    if (this.isBrowser) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }

    selectRole(role: string) {
    this.selectedRole = role;
  }

  onSubmit() {

    this.error = '';
    this.message = '';

     if (!this.turnstileToken) {
      this.error = 'Por favor completá la verificación'; //verificacion cloudflare
      return;
    }

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.auth.login({
      ...this.loginForm.value,
      turnstileToken: this.turnstileToken // cambio 4 cloudflare
})
    .subscribe({

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