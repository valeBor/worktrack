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
  imports: [CommonModule, FormsModule,Header, EmployeeListChild],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css'
})
export class EmployeeList implements OnInit {

  showFormAdd: boolean = false;
  showComponentchild: boolean = false;
  viewListEmp: boolean = true;
  searchText = '';
  employees: User[] = [];

  /**alta de usuario */
  employeeNew: User = {

    nombre: "",
    apellido: "",
    email: "",
    password: "",
    estado: false,
    role: null,

  };

  /**empleado usuario a modificar */
  employeeUPdate: User = {

    nombre: "",
    apellido: "",
    email: "",
    password: "",
    estado: false,
    role: null,

  };


  constructor(
    /**injectar servicios, dependencias */
    private router: Router,
    private userService: UserService

  ) { }


  ngOnInit(): void {

    /**ejecuta logica al inicializar*/
    this.getUsers();

  }


  getUsers(): void {

    this.userService.getUsers().subscribe({

      next: (data) => {

        this.employees = data;

        console.log(data);

      },

      error: (err) => {

        console.error(err);

      }

    });

  }


  filteredEmployees() {

    return this.employees.filter(employee =>

      employee.nombre
        .toLowerCase()
        .includes(this.searchText.toLowerCase())

    );

  }


  showFormAgregar(): void {

    this.showFormAdd = true;
    this.viewListEmp = false;

  }


  viewListemployee(): void {

    this.viewListEmp = true;
    this.showFormAdd = false;

  }


  addEmployeeInthis() {

    this.employees.push(this.employeeNew);

  }


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
    this.viewListEmp = true;

  }


  editEmployee(employeeToEdit: User): void {

    this.showComponentchild = true;
    this.viewListEmp = false;
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

    const index = this.employees.findIndex(

      (oneEmployee) => oneEmployee.email === employee.email

    );

    if (index !== -1) {

      this.employees[index] = employee;

    }

  }


  closeComponentchild() {

    this.showComponentchild = false;
    this.viewListEmp = true;

  }


  deleteEmployee(employeeToDelete: User) {

    const index = this.employees.findIndex(

      (oneEmployee) => oneEmployee.email === employeeToDelete.email

    );

    if (index !== -1) {

      this.employees.splice(index, 1);

    }

  }

}