import { Routes } from '@angular/router';
import { Login } from './pages/auth/login/login';
import { Admin } from './pages/admin/admin';
import { Rrhh } from './pages/rrhh/rrhh';
import { Scanner } from './pages/scanner/scanner';
import { Home } from './pages/home/home';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/auth/login/login').then(m => m.Login)
  },

  {
    path: 'admin', component: Admin
  },

  { path: 'rrhh', component: Rrhh },

  { path: 'scanner', component: Scanner },

  { path: 'home', component: Home }


];