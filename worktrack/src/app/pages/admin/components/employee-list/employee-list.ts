import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Header } from '../../../../components/header/header';
import { User } from '../../../../models/user.models';
import { EmployeeListChild } from '../employee-list-child/employee-list-child';
import { UserService } from '../../../../services/user-service';


@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Header,
    EmployeeListChild
  ],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css'
})
export class EmployeeList implements OnInit {


  showFormAdd: boolean = false;
  showComponentchild: boolean = false;
  viewListEmp: boolean = true;

  searchText = '';

  employees: User[] = [];


  // ====================================================
  // NUEVO EMPLEADO
  // ====================================================

  employeeNew: User = {

    nombre: '',
    apellido: '',
    email: '',
    password: '',
    estado: false,
    role: null,
    rol_id: null

  };


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

    private router: Router,

    private userService:
      UserService

  ) {}


  ngOnInit(): void {

    this.getUsers();

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

          console.log(data);

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


        const fullName = `
          ${employee.nombre ?? ''}
          ${employee.apellido ?? ''}
        `.toLowerCase();


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

          Boolean(employee.estado)
          ===
          status;


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

    this.showFormAdd = true;

    this.viewListEmp = false;

    this.showComponentchild = false;

  }


  // ====================================================
  // VOLVER A LISTADO
  // ====================================================

  viewListemployee(): void {

    this.viewListEmp = true;

    this.showFormAdd = false;

    this.showComponentchild = false;

  }


  // ====================================================
  // CREAR EMPLEADO
  // ====================================================

  addEmployeeInthis(): void {

    this.userService
      .createUser(
        this.employeeNew
      )
      .subscribe({

        next: () => {

          this.getUsers();

          this.cancelFormAdd();

        },

        error: (err) => {

          console.error(err);

        }

      });

  }


  // ====================================================
  // CANCELAR ALTA
  // ====================================================

  cancelFormAdd(): void {

    this.employeeNew = {

      nombre: '',
      apellido: '',
      email: '',
      password: '',
      estado: false,
      role: null,
      rol_id: null

    };


    this.showFormAdd = false;

    this.viewListEmp = true;

  }


  // ====================================================
  // ABRIR MODIFICACIÓN
  // ====================================================

  editEmployee(
    employeeToEdit: User
  ): void {

    this.showComponentchild = true;

    this.viewListEmp = false;


    this.employeeUPdate = {

      id:
        employeeToEdit.id,

      nombre:
        employeeToEdit.nombre,

      apellido:
        employeeToEdit.apellido,

      email:
        employeeToEdit.email,


      // IMPORTANTE:
      //
      // Nunca recuperamos la contraseña
      // desde el backend.
      //
      // Si queda vacío:
      // conserva la contraseña actual.
      //
      // Si Admin escribe algo:
      // será la nueva contraseña.

      password: '',


      estado:
        employeeToEdit.estado,

      role:
        employeeToEdit.role,

      rol_id:
        employeeToEdit.rol_id

    };

  }


  // ====================================================
  // GUARDAR MODIFICACIÓN
  // ====================================================

  editEmployeeTochild(
    employee: User
  ): void {

    if (!employee.id) {

      console.error(
        'No existe ID'
      );

      return;

    }


    this.userService
      .updateUser(
        employee.id,
        employee
      )
      .subscribe({

        next: () => {

          // Recargamos desde backend.
          //
          // Esto es mejor que intentar
          // reemplazar manualmente el usuario
          // porque nuestro PUT devuelve un mensaje,
          // no el usuario completo.

          this.getUsers();


          this.showComponentchild =
            false;

          this.viewListEmp =
            true;


          console.log(
            'Usuario actualizado'
          );

        },


        error: (err) => {

          console.error(err);

        }

      });

  }


  // ====================================================
  // CERRAR MODIFICACIÓN
  // ====================================================

  closeComponentchild(): void {

    this.showComponentchild =
      false;

    this.viewListEmp =
      true;

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

        },

        error: (err) => {

          console.error(err);

        }

      });

  }

}