import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';

import {
  AuthService
} from '../../../services/auth.service';


@Component({

  selector: 'app-reset-password',

  standalone: true,

  imports: [

    CommonModule,

    ReactiveFormsModule,

    RouterLink

  ],

  templateUrl: './reset-password.html',

  styleUrl: './reset-password.css'

})

export class ResetPassword
  implements OnInit {


  resetPasswordForm: FormGroup;


  token = '';

  error = '';

  message = '';

  loading = false;

  passwordUpdated = false;


  showNewPassword = false;

  showConfirmPassword = false;


  constructor(

    private fb: FormBuilder,

    private activatedRoute: ActivatedRoute,

    private authService: AuthService

  ) {

    this.resetPasswordForm =
      this.fb.group({

        newPassword: [

          '',

          [

            Validators.required,

            Validators.minLength(8),

            Validators.maxLength(64),

            Validators.pattern(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/
            )

          ]

        ],


        confirmPassword: [

          '',

          [

            Validators.required

          ]

        ]

      });

  }


  // ====================================================
  // OBTENER TOKEN DE LA URL
  // ====================================================

  ngOnInit(): void {

    this.token =

      this.activatedRoute
        .snapshot
        .paramMap
        .get('token') || '';


    if (!this.token) {

      this.error =

        'El enlace de recuperación no es válido.';

      this.resetPasswordForm.disable();

    }

  }


  // ====================================================
  // MOSTRAR U OCULTAR CONTRASEÑA NUEVA
  // ====================================================

  toggleNewPassword(): void {

    this.showNewPassword =
      !this.showNewPassword;

  }


  // ====================================================
  // MOSTRAR U OCULTAR CONFIRMACIÓN
  // ====================================================

  toggleConfirmPassword(): void {

    this.showConfirmPassword =
      !this.showConfirmPassword;

  }


  // ====================================================
  // ENVIAR CONTRASEÑA NUEVA
  // ====================================================

  onSubmit(): void {

    this.error = '';

    this.message = '';


    if (
      this.resetPasswordForm.invalid
    ) {

      this.resetPasswordForm
        .markAllAsTouched();

      return;

    }


    const newPassword =

      this.resetPasswordForm
        .get('newPassword')
        ?.value;


    const confirmPassword =

      this.resetPasswordForm
        .get('confirmPassword')
        ?.value;


    if (
      newPassword !== confirmPassword
    ) {

      this.error =

        'Las contraseñas no coinciden';

      return;

    }


    if (!this.token) {

      this.error =

        'El enlace de recuperación no es válido.';

      return;

    }


    this.loading = true;


    this.authService
      .resetPassword({

        token: this.token,

        newPassword: newPassword,

        confirmPassword: confirmPassword

      })
      .subscribe({

        next: (response) => {

          this.loading = false;

          this.passwordUpdated = true;

          this.message =
            response.message;

          this.resetPasswordForm
            .reset();

          this.resetPasswordForm
            .disable();

        },


        error: (error) => {

          this.loading = false;


          this.error =

            error.error?.message ||

            'No se pudo actualizar la contraseña';

        }

      });

  }

}