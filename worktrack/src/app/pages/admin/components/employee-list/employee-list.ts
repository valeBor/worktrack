import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Header} from '../../../../components/header/header';
import {User} from '../../../../models/user.models';
import {EmployeeListChild} from '../employee-list-child/employee-list-child';
import {UserService} from '../../../../services/user-service';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Header, EmployeeListChild],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css'
})
export class EmployeeList implements OnInit {
  showFormAdd = false;
  showComponentchild = false;
  viewListEmp = true;

  searchText = '';
  employees: User[] = [];

  savingNew = false;
  addAttempted = false;
  formError = '';
  successMessage = '';

  readonly namePattern =
    /^[\p{L}]+(?:[ '\u2019-][\p{L}]+)*$/u;

  readonly passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/;

  newEmployeeForm: FormGroup;

  // ====================================================
  // EMPLEADO A MODIFICAR
  // ====================================================

  employeeUPdate: User = {
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    estado: false,
    role: null,
    rol_id: null
  };

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {
    this.newEmployeeForm = this.fb.group({
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
          Validators.required,
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

  ngOnInit(): void {
    this.getUsers();
  }

  // ====================================================
  // LIMPIAR ERRORES DEL BACKEND AL ESCRIBIR
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
      this.newEmployeeForm
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
      this.newEmployeeForm.get(field);

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
  // OBTENER USUARIOS
  // ====================================================

  getUsers(): void {
    this.userService
      .getUsers()
      .subscribe({
        next: (data) => {
          this.employees = data;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
        }
      });
  }

  // ====================================================
  // FILTRAR EMPLEADOS
  // ====================================================

  private filterEmployeesByStatus(
    status: boolean
  ): User[] {
    const search =
      this.searchText
        .trim()
        .toLowerCase();

    return this.employees.filter(
      (employee) => {
        const fullName =
          `${employee.nombre ?? ''} ${employee.apellido ?? ''}`
            .toLowerCase();

        const email =
          (employee.email ?? '')
            .toLowerCase();

        const role =
          (employee.role ?? '')
            .toLowerCase();

        const matchesSearch =
          fullName.includes(search) ||
          email.includes(search) ||
          role.includes(search);

        const matchesStatus =
          Boolean(employee.estado) === status;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );
  }

  get activeEmployees(): User[] {
    return this.filterEmployeesByStatus(
      true
    );
  }

  get inactiveEmployees(): User[] {
    return this.filterEmployeesByStatus(
      false
    );
  }

  // ====================================================
  // MOSTRAR FORMULARIO ALTA
  // ====================================================

  showFormAgregar(): void {
    this.newEmployeeForm.reset({
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      estado: false,
      rol_id: null
    });

    this.showFormAdd = true;
    this.viewListEmp = false;
    this.showComponentchild = false;
    this.savingNew = false;
    this.addAttempted = false;
    this.formError = '';
    this.successMessage = '';
  }

  // ====================================================
  // VOLVER AL LISTADO
  // ====================================================

  viewListemployee(): void {
    this.showFormAdd = false;
    this.showComponentchild = false;
    this.viewListEmp = true;
    this.formError = '';
  }

  // ====================================================
  // SELECCIONAR ROL
  // ====================================================

  selectNewRole(roleId: number): void {
    if (this.savingNew) {
      return;
    }

    this.newEmployeeForm
      .get('rol_id')
      ?.setValue(roleId);

    this.newEmployeeForm
      .get('rol_id')
      ?.markAsTouched();
  }

  // ====================================================
  // CONSULTAR ERROR DE CAMPO
  // ====================================================

  isNewFieldInvalid(
    field: string
  ): boolean {
    const control =
      this.newEmployeeForm.get(field);

    return Boolean(
      control &&
      control.invalid &&
      (
        control.touched ||
        this.addAttempted
      )
    );
  }

  getNewFieldError(
    field: string
  ): string {
    const control =
      this.newEmployeeForm.get(field);

    if (!control?.errors) {
      return '';
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
          password: 'La contraseña es obligatoria',
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
  // CREAR EMPLEADO
  // ====================================================

  addEmployeeInthis(): void {
    if (this.savingNew) {
      return;
    }

    this.addAttempted = true;
    this.formError = '';
    this.successMessage = '';

    if (this.newEmployeeForm.invalid) {
      this.newEmployeeForm.markAllAsTouched();
      return;
    }

    const formValue =
      this.newEmployeeForm.getRawValue();

    const userData: User = {
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

    this.savingNew = true;
    this.newEmployeeForm.disable();

    this.userService
      .createUser(userData)
      .subscribe({
        next: () => {
          this.getUsers();
          this.cancelFormAdd();

          this.successMessage =
            'Empleado creado correctamente.';

          this.cdr.detectChanges();
        },
        error: (err) => {
          this.newEmployeeForm.enable();
          this.savingNew = false;

          const field =
            err.error?.field;

          const message =
            err.error?.message ||
            'No se pudo crear el empleado.';

          const control =
            this.newEmployeeForm.get(field);

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
  // CANCELAR ALTA
  // ====================================================

  cancelFormAdd(): void {
    this.newEmployeeForm.enable();

    this.newEmployeeForm.reset({
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      estado: false,
      rol_id: null
    });

    this.showFormAdd = false;
    this.viewListEmp = true;
    this.savingNew = false;
    this.addAttempted = false;
    this.formError = '';
  }

  // ====================================================
  // ABRIR MODIFICACIÓN
  // ====================================================

  editEmployee(
    employeeToEdit: User
  ): void {
    this.showComponentchild = true;
    this.viewListEmp = false;
    this.showFormAdd = false;
    this.successMessage = '';

    this.employeeUPdate = {
      id: employeeToEdit.id,
      nombre: employeeToEdit.nombre,
      apellido: employeeToEdit.apellido,
      email: employeeToEdit.email,
      password: '',
      estado: Boolean(employeeToEdit.estado),
      role: employeeToEdit.role,
      rol_id: employeeToEdit.rol_id
    };
  }

  // ====================================================
  // GUARDAR MODIFICACIÓN
  // ====================================================

 editEmployeeTochild(
  employee: User
): void {
  this.getUsers();

  this.showComponentchild = false;
  this.viewListEmp = true;

  this.successMessage =
    'Empleado actualizado correctamente.';

  this.cdr.detectChanges();
}

  // ====================================================
  // CERRAR MODIFICACIÓN
  // ====================================================

  closeComponentchild(): void {
    this.showComponentchild = false;
    this.viewListEmp = true;
  }

  // ====================================================
  // ELIMINAR EMPLEADO
  // ====================================================

  deleteEmployee(
    employeeToDelete: User
  ): void {
    if (!employeeToDelete.id) {
      return;
    }

    this.userService
      .deleteUser(
        employeeToDelete.id
      )
      .subscribe({
        next: () => {
          this.getUsers();

          this.successMessage =
            'Empleado eliminado correctamente.';

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
        }
      });
  }
}