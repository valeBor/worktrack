import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { Header } from '../../components/header/header';

@Component({
  selector: 'app-supervisor',
  standalone: true,
    imports: [CommonModule, DatePipe, Header],  
  templateUrl: './supervisor.html',
  styleUrls: ['./supervisor.css']
})

export class SupervisorComponent {

    hoy = new Date();

  supervisor = {
    nombre: 'Juan Pérez',
    email: 'juan.perez@empresa.com',
    empresa: 'Mi Empresa S.A.',
    rol: 'Supervisor',
    iniciales: 'JP'
  };

  estadoHoy = {
    entrada: '--:--',
    salida: '--:--'
  };

  estadisticas = {
    diasTrabajados: 18,
    horasTotales: 144,
    ausencias: 2
  };

  alertas = [
    'Baja asistencia detectada (80%)',
    '2 llegadas tarde este mes',
    'Patrón de bajo rendimiento identificado'
  ];

  constructor(private router: Router) {}

  verAlertas() {
    // navegar a alertas
  }

  escanearQR() {
    this.router.navigate(['/qr']);
  }

  verHistorial() {
    this.router.navigate(['/historial']);
  }

  gestionCronogramas() {
    this.router.navigate(['/cronogramas']);
  }

  cerrarSesion() {
    this.router.navigate(['/login']);
  }
}