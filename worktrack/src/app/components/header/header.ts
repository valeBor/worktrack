import { Component, Inject, OnInit, PLATFORM_ID, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Location, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Role } from '../../models/user.models';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit {

  @Input() titulo: string = 'WorkTrack';
  @Input() cantidadNotificaciones: number = 0;
  @Input() mostrarVolver: boolean = false;

  fecha: string = '';
  role: Role | '' = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private location: Location,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {

    this.fecha = new Date().toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    if (isPlatformBrowser(this.platformId)) {
      this.role = localStorage.getItem('role') as Role || '';
    }

  }

  volver(): void {
    this.location.back();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

}