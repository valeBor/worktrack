import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-rrhh',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './rrhh.html',
  styleUrl: './rrhh.css'
})
export class Rrhh {

  fechaActual = new Date().toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  rrhh = {
    nombre: 'Recursos Humanos',
    email: 'rrhh@empresa.com',
    empresa: 'Mi Empresa S.A.'
  };

  resumenMes = {
    empleados: 42,
    presentes: 35,
    ausencias: 4,
    modificaciones: 7
  };

}
