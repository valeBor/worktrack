import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {

  const auth = inject(AuthService);
  const router = inject(Router);

  // Primero, sesión iniciada
  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const rolesPermitidos = route.data['roles'] as string[] | undefined;

  // Si la ruta no define roles, alcanza con estar logueado
  if (!rolesPermitidos || rolesPermitidos.length === 0) {
    return true;
  }

  const rolActual = auth.getRole();

  if (rolActual && rolesPermitidos.includes(rolActual)) {
    return true;
  }

  // Logueado pero sin permiso -> lo mandamos a su home, no al login
  router.navigate(['/home']);
  return false;

};