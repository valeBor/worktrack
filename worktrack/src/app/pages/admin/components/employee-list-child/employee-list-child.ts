import {ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {User} from '../../../../models/user.models';
import {UserService} from '../../../../services/user-service';

@Component({
  selector: 'app-employee-list-child',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-list-child.html',
  styleUrl: './employee-list-child.css'
})
export class EmployeeListChild implements OnChanges {
  @Input() employeeToEdit!: User;

  @Output()
  employeeEdit =
    new EventEmitter<User>();

  @Output()
  closeEmployeeListChild =
    new EventEmitter<void>();

  savingEdit = false;
  editAttempted = false;
  formError = '';

  readonly namePattern =
    /^[\p{L}]+(?:[ '\u2019-][\p{L}]+)*$/u;

  readonly passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/;

  editEmployeeForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {
    this.editEmployeeForm = this.fb.group({
      nombre: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(30),
          Validators.pattern(this.namePattern)
        ]
      ],
      apellido: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(30),
          Validators.pattern(this.namePattern)
        ]
      ],
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(100),
          Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)
        ]
      ],
      password: [
        '',
        [
          Validators.minLength(8),
          Validators.maxLength(64),
          Validators.pattern(this.passwordPattern)
        ]
      ],
      estado: [false],
      rol_id: [
        null,
        Validators.required
      ]
    });

    this.configureBackendErrorCleaning();
  }

  // ====================================================
  // CARGAR USUARIO RECIBIDO
  // ====================================================

  ngOnChanges(
    changes: SimpleChanges
  ): void {
    if (
      changes['employeeToEdit'] &&
      this.employeeToEdit
    ) {
      this.editEmployeeForm.reset({
        nombre:
          this.employeeToEdit.nombre,

        apellido:
          this.employeeToEdit.apellido,

        email:
          this.employeeToEdit.email,

        password: '',

        estado:
          Boolean(
            this.employeeToEdit.estado
          ),

        rol_id:
          this.employeeToEdit.rol_id
      });

      this.savingEdit = false;
      this.editAttempted = false;
      this.formError = '';
    }
  }

  // ====================================================
  // LIMPIAR ERRORES DEL BACKEND
  // ====================================================

  private configureBackendErrorCleaning(): void {
    const fields = [
      'nombre',
      'apellido',
      'email',
      'password',
      'estado',
      'rol_id'
    ];

    fields.forEach((field) => {
      this.editEmployeeForm
        .get(field)
        ?.valueChanges
        .subscribe(() => {
          this.clearBackendError(field);
        });
    });
  }

  private clearBackendError(
    field: string
  ): void {
    const control =
      this.editEmployeeForm.get(field);

    if (!control?.errors?.['backend']) {
      this.formError = '';
      return;
    }

    const {
      backend,
      ...remainingErrors
    } = control.errors;

    control.setErrors(
      Object.keys(remainingErrors).length
        ? remainingErrors
        : null
    );

    this.formError = '';
  }

  // ====================================================
  // SELECCIONAR ROL
  // ====================================================

  selectRole(roleId: number): void {
    if (this.savingEdit) {
      return;
    }

    this.editEmployeeForm
      .get('rol_id')
      ?.setValue(roleId);

    this.editEmployeeForm
      .get('rol_id')
      ?.markAsTouched();
  }

  // ====================================================
  // CONSULTAR ERROR
  // ====================================================

  isEditFieldInvalid(
    field: string
  ): boolean {
    const control =
      this.editEmployeeForm.get(field);

    return Boolean(
      control &&
      control.invalid &&
      (
        control.touched ||
        this.editAttempted
      )
    );
  }

  getEditFieldError(
    field: string
  ): string {
    const control =
      this.editEmployeeForm.get(field);

    if (!control?.errors) {
      return '';
    }

    if (
      (
        field === 'nombre' ||
        field === 'apellido'
      ) &&
      typeof control.value === 'string' &&
      !control.value.trim()
    ) {
      return `El ${field} es obligatorio`;
    }

    if (control.errors['backend']) {
      return control.errors['backend'];
    }

    if (control.errors['required']) {
      const requiredMessages:
        Record<string, string> = {
          nombre: 'El nombre es obligatorio',
          apellido: 'El apellido es obligatorio',
          email: 'El email es obligatorio',
          rol_id: 'Debe seleccionar un rol'
        };

      return requiredMessages[field] ||
        'Este campo es obligatorio';
    }

    if (control.errors['minlength']) {
      if (field === 'password') {
        return 'La contraseña debe tener al menos 8 caracteres';
      }

      return `El ${field} debe tener al menos 2 caracteres`;
    }

    if (control.errors['maxlength']) {
      if (field === 'email') {
        return 'El email no puede superar los 100 caracteres';
      }

      if (field === 'password') {
        return 'La contraseña no puede superar los 64 caracteres';
      }

      return `El ${field} no puede superar los 30 caracteres`;
    }

    if (
      field === 'email' &&
      (
        control.errors['email'] ||
        control.errors['pattern']
      )
    ) {
      return 'El formato del email no es válido';
    }

    if (
      field === 'password' &&
      control.errors['pattern']
    ) {
      return 'La contraseña debe incluir mayúscula, minúscula y número';
    }

    if (
      (
        field === 'nombre' ||
        field === 'apellido'
      ) &&
      control.errors['pattern']
    ) {
      return `El ${field} solo puede contener letras, espacios, apóstrofes y guiones`;
    }

    return 'El valor ingresado no es válido';
  }

  // ====================================================
  // GUARDAR MODIFICACIÓN
  // ====================================================

  editEmployee(): void {
    if (
      this.savingEdit ||
      !this.employeeToEdit.id
    ) {
      return;
    }

    this.editAttempted = true;
    this.formError = '';

    if (this.editEmployeeForm.invalid) {
      this.editEmployeeForm.markAllAsTouched();
      return;
    }

    const formValue =
      this.editEmployeeForm.getRawValue();

    const employeeModified: User = {
      id: this.employeeToEdit.id,

      nombre: formValue.nombre
        .trim()
        .replace(/\s+/g, ' '),

      apellido: formValue.apellido
        .trim()
        .replace(/\s+/g, ' '),

      email: formValue.email
        .trim()
        .toLowerCase(),

      password: formValue.password,
      estado: Boolean(formValue.estado),
      rol_id: Number(formValue.rol_id)
    };

    this.savingEdit = true;
    this.editEmployeeForm.disable();

    this.userService
      .updateUser(
        employeeModified.id!,
        employeeModified
      )
      .subscribe({
        next: () => {
          this.savingEdit = false;

          this.employeeEdit.emit(
            employeeModified
          );
        },
        error: (err) => {
          this.editEmployeeForm.enable();
          this.savingEdit = false;

          const field =
            err.error?.field;

          const message =
            err.error?.message ||
            'No se pudo actualizar el empleado.';

          const control =
            this.editEmployeeForm.get(field);

          if (
            field &&
            field !== 'form' &&
            control
          ) {
            control.setErrors({
              ...control.errors,
              backend: message
            });

            control.markAsTouched();
          } else {
            this.formError = message;
          }

          this.cdr.detectChanges();
        }
      });
  }

  // ====================================================
  // CERRAR
  // ====================================================

  cerrar(): void {
    if (this.savingEdit) {
      return;
    }

    this.closeEmployeeListChild.emit();
  }
}