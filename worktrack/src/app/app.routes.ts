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

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/auth/login/login').then(m => m.Login) },
  { path: 'admin', component: Admin },
  { path: 'rrhh', component: Rrhh },
  { path: 'scanner', component: Scanner },
  { path: 'home', component: Home },
  { path: 'employee-list', component: EmployeeList },
  { path: 'supervisor', component: SupervisorComponent },
  { path: 'employee', component: Employee },
  {path:'qr-visor', component: QrVisor},
  {path: 'cambio-horario', component: CambioHorario}
];