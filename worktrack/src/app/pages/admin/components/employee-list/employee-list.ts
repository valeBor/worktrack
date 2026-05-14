// employee-list.ts

import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';
import { Header } from '../../../../components/header/header';



@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Header
  
  ],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css'
})
export class EmployeeList {

  searchText = '';

  employees = [

    {
      id: 1,
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@empresa.com',
      role: 'Administrador',
      estado: true
    },

    {
      id: 2,
      nombre: 'Laura',
      apellido: 'Gómez',
      email: 'laura@empresa.com',
      role: 'Supervisor',
      estado: true
    },

    {
      id: 3,
      nombre: 'Carlos',
      apellido: 'Ruiz',
      email: 'carlos@empresa.com',
      role: 'Empleado',
      estado: false
    }

  ];

  constructor(private router: Router) {}

  filteredEmployees() {

    return this.employees.filter(employee =>

      employee.nombre
        .toLowerCase()
        .includes(this.searchText.toLowerCase())

    );

  }

  goToAddEmployee() {

    this.router.navigate(['/add-employee']);

  }

  editEmployee(id: number) {

    console.log('Editar empleado', id);

  }

  deleteEmployee(id: number) {

    console.log('Eliminar empleado', id);

  }

}
