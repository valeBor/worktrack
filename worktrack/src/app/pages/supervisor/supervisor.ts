import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { Header } from '../../components/header/header';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-supervisor',
  standalone: true,
  imports: [CommonModule, Header],
  templateUrl: './supervisor.html',
  styleUrls: ['./supervisor.css']
})
export class SupervisorComponent implements OnInit {

  hoy = new Date();

  supervisor = {
    nombre: '',
    apellido: '',
    email: '',
    role: '',
    iniciales: ''
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

  constructor(
    private router: Router,
    private auth: AuthService
  ) {}



  ngOnInit(): void {

    const user = this.auth.getUser();

    if (!user) {

      this.router.navigate(['/login']);

      return;

    }

    this.supervisor = {
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      role: user.role,
      iniciales:
        user.nombre.charAt(0).toUpperCase() +
        user.apellido.charAt(0).toUpperCase()
    };
  }



  verAlertas(): void {

    console.log('Ver alertas');

  }



  escanearQR(): void {

    this.router.navigate(['/scanner']);

  }



  verHistorial(): void {

    this.router.navigate(['/historial']);

  }



  gestionCronogramas(): void {

    this.router.navigate(['/gestion-cronogramas']);

  }



  cerrarSesion(): void {

    this.auth.logout();

    this.router.navigate(['/login']);

  }

}