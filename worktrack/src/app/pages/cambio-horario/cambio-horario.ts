import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Header } from '../../components/header/header';

@Component({
  selector: 'app-cambio-horario',
  standalone: true,
  imports: [CommonModule, RouterLink, Header],
  templateUrl: './cambio-horario.html',
  styleUrl: './cambio-horario.css'
})
export class CambioHorario {

  solicitudes = [
    {
      estado: 'En revisión',
      fechaEnvio: '20/04/2026 10:30',
      fechaCambio: '24/04/2026',
      horarioActual: '08:00 - 16:00',
      horarioSolicitado: '14:00 - 22:00',
      motivo: 'Necesito llevar a mi hijo al médico por la mañana',
      etiqueta: 'Pendiente'
    }
  ];

  constructor(private router: Router) {}

  volver(): void {
    this.router.navigate(['/employee']);
  }

  nuevaSolicitud(): void {
    this.router.navigate(['/formulario-cambio-horario']);
  }
}
