import {Component, Input, Output, EventEmitter} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../../../models/user.models';


@Component({
  selector: 'app-employee-list-child',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './employee-list-child.html',
  styleUrl: './employee-list-child.css'
})

export class EmployeeListChild {
  // Usuario recibido desde employee-list.

  @Input()
  employeeToEdit!: User;

  // Envía el usuario modificado
  // al componente padre.

  @Output()
  employeeEdit =
    new EventEmitter<User>();

  @Output()
  closeEmployeeListChild =
    new EventEmitter<void>();


  // ====================================================
  // MODIFICAR
  // ====================================================

  editEmployee(employeeToModified: User): void {

    const employeeModified: User = {
      id: employeeToModified.id,
      nombre: employeeToModified.nombre,
      apellido: employeeToModified.apellido, 
      email: employeeToModified.email,
      password:employeeToModified.password,
      estado:employeeToModified.estado,
      role:employeeToModified.role,
      rol_id: employeeToModified.rol_id
    }; 

    this.employeeEdit.emit(
      employeeModified
    );

  }


  // ====================================================
  // CERRAR
  // ====================================================

  cerrar(): void {

    this.closeEmployeeListChild.emit();

  }

}