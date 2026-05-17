import { Component } from '@angular/core';
import { CommonModule, NgPlural } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Header } from '../../../../components/header/header';
import { User, Role } from '../../../../models/user.models';



@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, Header],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css'
})
export class EmployeeList {

  showFormAdd: boolean = false;
  showComponentchild: boolean = false;
  searchText = '';
  /**todo del mismo tipo...lista, empleados, nuevo empleado */
  employees: User[] = [

    {

      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@empresa.com',
      role: 'admin',
      estado: true

    },

    {

      nombre: 'Laura',
      apellido: 'Gómez',
      email: 'laura@empresa.com',
      role: 'supervisor',
      estado: true

    },

    {

      nombre: 'Carlos',
      apellido: 'Ruiz',
      email: 'carlos@empresa.com',
      role: 'empleado',
      estado: false

    }

  ];

  showFormAgregar(): void {
    this.showFormAdd = true;

  }

  constructor(private router: Router) { }

  filteredEmployees() {

    return this.employees.filter(employee =>

      employee.nombre
        .toLowerCase()
        .includes(this.searchText.toLowerCase())

    );

  }


  employeeNew: User = {

    nombre: "",
    apellido: "",
    email: "",
    password: "",
    estado: false,
    role: null,
  }


  employeeUPdate: User = {

    nombre: "",
    apellido: "",
    email: "",
    password: "",
    estado: false,
    role: null,

  }

  /**agregar empleado */
  addEmployeeInthis() {

    this.employees.push(this.employeeNew);

  }

  /**cancela el formulario agregar, limpia el forms y
 *  mostrarformularioagregar en false */
  cancelFormAdd(): void {
    this.employeeNew = {

      nombre: "",
      apellido: "",
      email: "",
      password: "",
      estado: false,
      role: null,

    };
    this.showFormAdd = false;

  }


  editEmployee(employeeToEdit: User): void {
    this.showComponentchild = true,
      this.employeeUPdate = {
        nombre: employeeToEdit.nombre,
        apellido: employeeToEdit.apellido,
        email: employeeToEdit.email,
        password: employeeToEdit.password,
        estado: employeeToEdit.estado,
        role: employeeToEdit.role,

      };
  }



  editEmployeeTochild(employee: User) {

    const index = this.employees.findIndex((oneEmployee) => oneEmployee.email === employee.email);
    if (index !== -1) {
      this.employees[index] = employee;
    }

  }

  closeComponentchild(){
       this.showComponentchild=false;

  }

  deleteEmployee(employeeToDelete: User) {

    const index = this.employees.findIndex((oneEmployee) => oneEmployee.email === employeeToDelete.email);
    if (index !== -1) {
      this.employees.splice(index, 1)
    }
  }


}


