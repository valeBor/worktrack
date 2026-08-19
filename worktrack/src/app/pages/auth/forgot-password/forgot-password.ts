import { AfterViewInit, Component, Inject, OnDestroy, PLATFORM_ID} from '@angular/core';
import { CommonModule, isPlatformBrowser} from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { RouterLink} from '@angular/router';
import { AuthService} from '../../../services/auth.service';
import { environment} from '../../../../environments/environment';


declare global {

  interface Window {

    turnstile: any;

  }

}


@Component({

  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})

export class ForgotPassword
  implements AfterViewInit, OnDestroy {


  forgotPasswordForm: FormGroup;


  error = '';
  message = '';
  loading = false;

  siteKey =
    environment.turnstileSiteKey;

  turnstileToken: string | null = null;
  widgetId: string | null = null;
  isBrowser = false;


  constructor(

    private fb: FormBuilder,
    private authService: AuthService,
    @Inject(PLATFORM_ID)
    private platformId: Object

  ) {

    this.isBrowser =
      isPlatformBrowser(this.platformId);


    this.forgotPasswordForm =
      this.fb.group({

        email: [

          '',

          [

            Validators.required,
            Validators.email,
            Validators.pattern(
              /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            )

          ]

        ]

      });

  }


  // ====================================================
  // INICIAR TURNSTILE
  // ====================================================

  ngAfterViewInit(): void {

    if (!this.isBrowser) {

      return;

    }


    this.loadTurnstileScript();

  }


  // ====================================================
  // CARGAR SCRIPT DE CLOUDFLARE
  // ====================================================

  loadTurnstileScript(): void {

    const scriptId =
      'cloudflare-turnstile-script';


    const scriptExiste =
      document.getElementById(scriptId);


    // Si el login ya cargó el script,
    // no volvemos a descargarlo.
    if (scriptExiste) {

      this.renderTurnstile();

      return;

    }


    const script =
      document.createElement('script');


    script.id = scriptId;

    script.src =

      'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';


    script.async = true;
    script.defer = true;

    script.onload = () => {
      this.renderTurnstile();

    };


    document.head.appendChild(script);

  }


  // ====================================================
  // MOSTRAR WIDGET DE TURNSTILE
  // ====================================================

  renderTurnstile(): void {

    setTimeout(() => {

      const container =

        document.getElementById(
          'forgot-turnstile-container'
        );


      if (
        !container ||
        !window.turnstile
      ) {

        return;

      }


      container.innerHTML = '';
      this.turnstileToken = null;

      this.widgetId =

        window.turnstile.render(

          '#forgot-turnstile-container',

          {

            sitekey: this.siteKey,


            callback: (
              token: string
            ) => {

              this.turnstileToken =
                token;

              this.error = '';

            },


            'expired-callback': () => {

              this.turnstileToken =
                null;

            },


            'error-callback': () => {

              this.turnstileToken =
                null;

              this.error =

                'Error en la verificación. Intentá nuevamente.';

            }

          }

        );

    }, 0);

  }


  // ====================================================
  // ENVIAR SOLICITUD
  // ====================================================

  onSubmit(): void {

    this.error = '';
    this.message = '';


    if (
      this.forgotPasswordForm.invalid
    ) {

      this.forgotPasswordForm
        .markAllAsTouched();

      return;

    }


    if (!this.turnstileToken) {

      this.error =

        'Por favor completá la verificación';

      return;

    }


    this.loading = true;


    const email =

      this.forgotPasswordForm
        .get('email')
        ?.value;


    this.authService
      .forgotPassword({

        email: email,

        turnstileToken:
          this.turnstileToken

      })
      .subscribe({

        next: (response) => {

          this.loading = false;
          this.message =
            response.message;
          this.forgotPasswordForm
            .reset();

          this.resetTurnstile();

        },


        error: (error) => {

          this.loading = false;


          this.error =

            error.error?.message ||

            'No se pudo procesar la solicitud';


          this.resetTurnstile();

        }

      });

  }


  // ====================================================
  // REINICIAR TURNSTILE
  // ====================================================

  resetTurnstile(): void {

    if (
      this.isBrowser &&
      window.turnstile &&
      this.widgetId
    ) {

      window.turnstile.reset(
        this.widgetId
      );

      this.turnstileToken = null;

    }

  }


  // ====================================================
  // DESTRUIR WIDGET
  // ====================================================

  ngOnDestroy(): void {

    if (
      this.isBrowser &&
      window.turnstile &&
      this.widgetId
    ) {

      window.turnstile.remove(
        this.widgetId
      );

    }

  }

}