import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef
} from '@angular/core';

import {
  CommonModule,
  isPlatformBrowser
} from '@angular/common';

import { Router } from '@angular/router';

import { Header } from '../../components/header/header';
import { AuthService } from '../../services/auth.service';
import { HorarioService } from '../../services/horario.service';
import { AsistenciaService } from '../../services/asistecia.service';

import { Horario } from '../../models/horario.model';
import { AsistenciaHoy } from '../../models/asistencia.model';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [Header, CommonModule],
  templateUrl: './employee.html',
  styleUrl: './employee.css'
})
export class Employee implements OnInit {

  isBrowser = false;

  empleado = {
    nombre: '',
    apellido: '',
    email: '',
    role: '',
    iniciales: ''
  };

  horarioHoy: Horario | null = null;
  asistenciaHoy: AsistenciaHoy | null = null;

  cargandoHorario = true;
  cargandoAsistencia = true;
  registrando = false;

  mensaje = '';
  error = '';

  estadisticas = {
    diasTrabajados: 18,
    horasTotales: 144,
    ausencias: 2
  };

  alertas = [
    'Baja asistencia detectada (80%)',
    '2 llegadas tarde este mes',
    'Patrón de bajo rendimiento identificado'
  ];

  constructor(
    private router: Router,
    private auth: AuthService,
    private horarioService: HorarioService,
    private asistenciaService: AsistenciaService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {

    if (!this.isBrowser) {
      return;
    }

    const user = this.auth.getUser();

    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.empleado = {
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      role: user.role,
      iniciales:
        user.nombre.charAt(0).toUpperCase() +
        user.apellido.charAt(0).toUpperCase()
    };

    this.cargarHorarioHoy();
    this.cargarAsistenciaHoy();
  }

  // =====================================================
  // CARGAR HORARIO DE HOY
  // =====================================================

  cargarHorarioHoy(): void {

    this.cargandoHorario = true;

    this.horarioService
      .getMiHorarioHoy()
      .subscribe({

        next: (horario) => {
          this.horarioHoy = horario;
          this.cargandoHorario = false;
          this.cdr.detectChanges();
        },

        error: (err) => {
          this.cargandoHorario = false;
          this.horarioHoy = null;

          this.error =
            err.error?.mensaje ||
            'No fue posible obtener el horario de hoy.';

          this.cdr.detectChanges();
        }

      });
  }

  // =====================================================
  // CARGAR ASISTENCIA REAL DE HOY
  // =====================================================

  cargarAsistenciaHoy(): void {

    this.cargandoAsistencia = true;

    this.asistenciaService
      .obtenerMiAsistenciaHoy()
      .subscribe({

        next: (data) => {
          this.asistenciaHoy = data;
          this.cargandoAsistencia = false;
          this.cdr.detectChanges();
        },

        error: (err) => {
          this.cargandoAsistencia = false;

          this.error =
            err.error?.mensaje ||
            'No fue posible obtener la asistencia de hoy.';

          this.cdr.detectChanges();
        }

      });
  }

  // =====================================================
  // ACCIÓN PRINCIPAL
  // =====================================================

  accionAsistencia(): void {

    if (!this.horarioHoy) {
      return;
    }

    const modalidad =
      String(this.horarioHoy.modalidad).toUpperCase();

    if (modalidad === 'PRESENCIAL') {
      this.router.navigate(['/scanner']);
      return;
    }

    if (modalidad === 'HOME') {
      this.registrarAsistenciaHome();
    }
  }

  // =====================================================
  // REGISTRAR HOME
  // =====================================================

  registrarAsistenciaHome(): void {

    if (!this.asistenciaHoy) {
      return;
    }

    if (this.asistenciaHoy.jornadaCompletada) {
      return;
    }

    const tipo =
      this.asistenciaHoy.proximaAccion;

    if (!tipo) {
      return;
    }

    this.registrando = true;
    this.mensaje = '';
    this.error = '';

    this.asistenciaService
      .registrarAsistencia({
        tipo: tipo
      })
      .subscribe({

        next: (respuesta) => {
          this.registrando = false;

          this.mensaje =
            respuesta.mensaje ||
            'Asistencia registrada correctamente.';

          // Volvemos al backend para obtener
          // el estado real actualizado.
          this.cargarAsistenciaHoy();

          this.cdr.detectChanges();
        },

        error: (err) => {
          this.registrando = false;

          this.error =
            err.error?.mensaje ||
            'No fue posible registrar la asistencia.';

          // También recargamos por seguridad
          // para mantener sincronizado el estado.
          this.cargarAsistenciaHoy();

          this.cdr.detectChanges();
        }

      });
  }

  // =====================================================
  // TEXTO DEL BOTÓN
  // =====================================================

  get textoBotonAsistencia(): string {

    if (
      this.cargandoHorario ||
      this.cargandoAsistencia
    ) {
      return 'Cargando...';
    }

    if (!this.horarioHoy) {
      return 'Sin horario asignado';
    }

    if (
      String(this.horarioHoy.modalidad).toUpperCase()
      === 'PRESENCIAL'
    ) {
      return 'Escanear QR';
    }

    if (this.asistenciaHoy?.jornadaCompletada) {
      return 'Jornada completada';
    }

    if (
      this.asistenciaHoy?.proximaAccion === 'salida'
    ) {
      return 'Registrar salida';
    }

    return 'Registrar entrada';
  }

  // =====================================================
  // SUBTÍTULO DEL BOTÓN
  // =====================================================

  get subtituloBotonAsistencia(): string {

    if (!this.horarioHoy) {
      return 'Consulte con su supervisor';
    }

    if (
      String(this.horarioHoy.modalidad).toUpperCase()
      === 'PRESENCIAL'
    ) {
      return 'Registrar asistencia presencial';
    }

    if (this.asistenciaHoy?.jornadaCompletada) {
      return 'Entrada y salida registradas';
    }

    if (
      this.asistenciaHoy?.proximaAccion === 'salida'
    ) {
      return 'Finalizar jornada HOME';
    }

    return 'Iniciar jornada HOME';
  }

  // =====================================================
  // HORAS PARA MOSTRAR EN HTML
  // =====================================================

  get horarioEntrada(): string {

    if (!this.horarioHoy?.hora_entrada) {
      return '--:--';
    }

    return this.horarioHoy.hora_entrada.substring(0, 5);
  }

  get horarioSalida(): string {

    if (!this.horarioHoy?.hora_salida) {
      return '--:--';
    }

    return this.horarioHoy.hora_salida.substring(0, 5);
  }

  get entradaRegistrada(): string {

    const hora =
      this.asistenciaHoy?.asistencia?.hora_entrada;

    if (!hora) {
      return '--:--';
    }

    return hora.substring(0, 5);
  }

  get salidaRegistrada(): string {

    const hora =
      this.asistenciaHoy?.asistencia?.hora_salida;

    if (!hora) {
      return '--:--';
    }

    return hora.substring(0, 5);
  }

  // =====================================================
  // RESTO DE NAVEGACIÓN
  // =====================================================

  verHistorial(): void {
    this.router.navigate(['/historial']);
  }

  gestionCambioDeHorario(): void {
    this.router.navigate(['/cambio-horario']);
  }

  verAlertas(): void {
    console.log('Ver alertas');
  }

  cerrarSesion(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}