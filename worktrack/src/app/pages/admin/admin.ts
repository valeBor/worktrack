import { CommonModule } from '@angular/common';
import { Component, OnInit} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {Router,RouterModule} from '@angular/router';
import { Header } from '../../components/header/header';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Header],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {
  admin = {
    nombre: '',
    apellido: '',
    email: '',
    role: '',
    iniciales: ''
  };

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

    this.admin = {
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      role: user.role,
      iniciales:
        user.nombre.charAt(0).toUpperCase() +
        user.apellido.charAt(0).toUpperCase()
    };
  }

  irAEmployees(): void {
    this.router.navigate([
      '/employee-list'
    ]);
  }

  irAqrDinamico(): void {
    this.router.navigate([
      '/qr-visor'
    ]);
  }

  irAGestionCronogramas(): void {
    this.router.navigate([
      '/gestion-cronogramas'
    ]);
  }
}