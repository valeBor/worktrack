import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Component, Inject, PLATFORM_ID, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../../../services/auth.service';
import { AuthResponse } from '../../../models/auth-response.model';

declare global {
  interface Window {
    turnstile: any;
    onTurnstileSuccess: (token: string) => void;
  }
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements AfterViewInit, OnDestroy {

  error = '';
  message = '';

  siteKey = '1x00000000000000000000AA';

  turnstileToken: string | null = null;
  widgetId: string | null = null;

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
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    window.onTurnstileSuccess = (token: string) => {
      this.turnstileToken = token;
    };

    this.loadTurnstileScript();
  }

  loadTurnstileScript(): void {
    const scriptId = 'cloudflare-turnstile-script';

    const scriptExiste = document.getElementById(scriptId);

    if (scriptExiste) {
      this.renderTurnstile();
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      this.renderTurnstile();
    };

    document.head.appendChild(script);
  }

  renderTurnstile(): void {
    setTimeout(() => {
      const container = document.getElementById('turnstile-container');

      if (!container || !window.turnstile) return;

      container.innerHTML = '';
      this.turnstileToken = null;

      this.widgetId = window.turnstile.render('#turnstile-container', {
        sitekey: this.siteKey,
        callback: (token: string) => {
          this.turnstileToken = token;
        },
        'expired-callback': () => {
          this.turnstileToken = null;
        },
        'error-callback': () => {
          this.turnstileToken = null;
          this.error = 'Error en la verificación. Intentá nuevamente.';
        }
      });
    }, 0);
  }

  selectRole(role: string): void {
    this.selectedRole = role;
  }

  onSubmit(): void {
    this.error = '';
    this.message = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    if (!this.turnstileToken) {
      this.error = 'Por favor completá la verificación';
      return;
    }

    this.auth.login({
      ...this.loginForm.value,
      turnstileToken: this.turnstileToken
    })
      .subscribe({
        next: (res: AuthResponse) => {

          this.auth.saveUser(res);
          localStorage.setItem('role', res.user.role);

          this.message = 'Login correcto';

          if (res.user.role === 'admin') {
            this.router.navigate(['/admin']);

          } else if (res.user.role === 'rrhh') {
            this.router.navigate(['/rrhh']);

          } else if (res.user.role === 'empleado') {
            this.router.navigate(['/employee']);

          } else if (res.user.role === 'supervisor') {
            this.router.navigate(['/supervisor']);

          } else {
            this.router.navigate(['/home']);
          }

          console.log(res);
        },

        error: (err) => {
          this.resetTurnstile();

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

  resetTurnstile(): void {
    if (this.isBrowser && window.turnstile && this.widgetId) {
      window.turnstile.reset(this.widgetId);
      this.turnstileToken = null;
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser && window.turnstile && this.widgetId) {
      window.turnstile.remove(this.widgetId);
    }
  }
}