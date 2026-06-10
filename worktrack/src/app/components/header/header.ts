import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { Input } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Role } from '../../models/user.models';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit {

  fecha: string = '';
  role: Role | '' = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private location: Location,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  @Input() titulo: string = 'WorkTrack';
  
  ngOnInit(): void {

    this.fecha = new Date().toLocaleDateString();
    //verifica estar en el navegador
    if (isPlatformBrowser(this.platformId)) {
      this.role = localStorage.getItem('role') as Role || '';
    }

  }
  //pagina atras---ver de reemplazar por inicio..o dashboard principal
  volver(): void {
    this.location.back();
  }


  //cierra sesion remueve los datos del navegador, no todos solo los necesarios, vuelve al login
  logout(): void {

    this.authService.logout();

    this.router.navigate(['/login']);

  }

}