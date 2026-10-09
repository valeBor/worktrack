import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Header } from '../../components/header/header';
import { CommonModule } from '@angular/common';
import { QrAdmin } from '../../components/qr-admin/qr-admin';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-qr-visor',
  standalone: true,
  imports: [CommonModule, QrAdmin],
  templateUrl: './qr-visor.html',
  styleUrl: './qr-visor.css',
})
export class QrVisor implements OnInit {
  active = false;
  error = '';

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    if (typeof window === 'undefined') return;

    if (this.auth.getRole() === 'kiosk') {
      this.active = true;
      return;
    }

    // Se cambia la sesión antes de montar el componente que solicita el QR.
    this.auth.activateKiosk().subscribe({
      next: ({ token }) => {
        this.auth.saveKioskToken(token);
        this.active = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'No se pudo activar el tótem. Cerrá la sesión y volvé a intentarlo.';
        this.cdr.detectChanges();
      }
    });
  }

  exit(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
