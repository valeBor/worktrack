import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {

  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn() && auth.getRole() !== 'kiosk') {
    return true;
  }

  if (auth.getRole() === 'kiosk') auth.logout();
  return router.parseUrl('/login');

};
