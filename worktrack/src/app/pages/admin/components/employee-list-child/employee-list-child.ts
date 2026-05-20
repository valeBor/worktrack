import { CommonModule } from '@angular/common';
import { Component, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../../../models/user.models';
import { EventEmitter } from '@angular/core';

@Component({
  selector: 'app-employee-list-child',
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-list-child.html',
  styleUrl: './employee-list-child.css',
})
export class EmployeeListChild {

/*input...empleado que viene del componente employeeList principal*/ 
  @Input() employeeToEdit!: User;
/**output envia a traves de un evento la modificacion del registro al componente principal employeeList */
  @Output() employeeEdit = new EventEmitter<User>();

  @Output() closeEmployeeListChild = new EventEmitter<void>();


  editEmployee(employeeTomodified: User) {
    /**crea otro objeto lo modifica */
    let employeeModified: User = {

      nombre: employeeTomodified.nombre,
      apellido: employeeTomodified.apellido,      
      email: employeeTomodified.email,
      password: employeeTomodified.password,
      estado: employeeTomodified.estado,
      role: employeeTomodified.role,

    };
    this.employeeEdit.emit(employeeModified);

  }

  cerrar() {

    this.closeEmployeeListChild.emit();

  }








}
