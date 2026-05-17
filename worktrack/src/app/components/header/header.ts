import {Component, Inject, OnInit, PLATFORM_ID} from '@angular/core';
import { CommonModule, isPlatformBrowser} from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {

  role = '';
  fecha = '';

  constructor(
    @Inject(PLATFORM_ID)
    private platformId: Object
  ) {}

  ngOnInit(): void {

    // ✔ Verifica que esté ejecutando en navegador
    if (isPlatformBrowser(this.platformId)) {

      this.role =
        localStorage.getItem('role') || '';

    }

    this.fecha =
      new Date().toLocaleDateString();

  }

  logout(): void {

    localStorage.clear();

  }

}