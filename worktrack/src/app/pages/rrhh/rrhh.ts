import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Header } from '../../components/header/header';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-rrhh',
  standalone: true,
  imports: [CommonModule, RouterModule, Header],
  templateUrl: './rrhh.html',
  styleUrl: './rrhh.css'
})
export class Rrhh implements OnInit{

  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

    rrhh = {
    nombre: '',
    apellido: '',
    email: '',
    role: '',
    iniciales: ''
  };



  ngOnInit(): void {

    const user = this.auth.getUser();

    if (!user) {

      this.router.navigate(['/login']);

      return;

    }

    this.rrhh = {
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      role: user.role,
      iniciales:
        user.nombre.charAt(0).toUpperCase() +
        user.apellido.charAt(0).toUpperCase()
    };
  }

  fechaActual = new Date().toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });



  resumenMes = {
    empleados: 42,
    presentes: 35,
    ausencias: 4,
    modificaciones: 7
  };

}
