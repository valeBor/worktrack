import {Component,Inject,OnInit,PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {Router} from '@angular/router';
import {Header} from '../../components/header/header';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [Header],
  templateUrl: './not-found.html',
  styleUrl: './not-found.css'
})
export class NotFound implements OnInit {
  isLoggedIn = false;
  destinationRoute = '/login';
  buttonText = 'Iniciar sesión';

  constructor(
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isLoggedIn =
      this.authService.isLoggedIn();

    if (!this.isLoggedIn) {
      return;
    }

    const role = String(
      this.authService.getRole() || ''
    ).toLowerCase();

    this.destinationRoute =
      this.getDashboardRoute(role);

    this.buttonText = 'Volver a mi panel';
  }

  goBack(): void {
    this.router.navigate([
      this.destinationRoute
    ]);
  }

  private getDashboardRoute(role: string): string {
    const routesByRole: Record<string, string> = {
      admin: '/admin',
      rrhh: '/rrhh',
      supervisor: '/supervisor',
      empleado: '/employee'
    };

    return routesByRole[role] || '/home';
  }
}