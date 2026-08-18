import { Routes } from '@angular/router';
import { Login } from './pages/auth/login/login';
import { Admin } from './pages/admin/admin';
import { Rrhh } from './pages/rrhh/rrhh';
import { Scanner } from './pages/scanner/scanner';
import { Home } from './pages/home/home';
import { EmployeeList } from './pages/admin/components/employee-list/employee-list';
import { SupervisorComponent } from './pages/supervisor/supervisor';
import { Employee } from './pages/employee/employee';
import { QrVisor } from './pages/qr-visor/qr-visor';
import { CambioHorario } from './pages/cambio-horario/cambio-horario';
import { GestionCronogramas } from './pages/gestion-cronogramas/gestion-cronogramas';
import { roleGuard } from './guards/role.guard';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/auth/login/login').then(m => m.Login) },

  { path: 'home', component: Home, canActivate: [authGuard] },

  { path: 'admin', component: Admin, canActivate: [roleGuard], data: { roles: ['admin'] } },
  { path: 'employee-list', component: EmployeeList, canActivate: [roleGuard], data: { roles: ['admin'] } },

  { path: 'rrhh', component: Rrhh, canActivate: [roleGuard], data: { roles: ['rrhh', 'admin'] } },

  { path: 'supervisor', component: SupervisorComponent, canActivate: [roleGuard], data: { roles: ['supervisor', 'admin'] } },
  { path: 'gestion-cronogramas', component: GestionCronogramas, canActivate: [roleGuard], data: { roles: ['supervisor', 'admin'] } },

  { path: 'employee', component: Employee, canActivate: [roleGuard], data: { roles: ['empleado'] } },
  { path: 'cambio-horario', component: CambioHorario, canActivate: [roleGuard], data: { roles: ['empleado'] } },

  { path: 'scanner', component: Scanner, canActivate: [authGuard] },
  { path: 'qr-visor', component: QrVisor, canActivate: [roleGuard], data: { roles: ['admin', 'supervisor', 'rrhh'] } },
];