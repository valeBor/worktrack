import {Component, OnInit,Inject, PLATFORM_ID,ChangeDetectorRef} from '@angular/core';
import {CommonModule,isPlatformBrowser} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Header } from '../../components/header/header';
import { Modal } from '../../components/modal/modal';
import {Toast, TipoToast} from '../../components/toast/toast';
import { User, Role } from '../../models/user.models';
import {Horario, HorarioNuevo, CronogramaAgrupado} from '../../models/horario.model';
import {HorarioService} from '../../services/horario.service';
import {AuthService} from '../../services/auth.service';
import {SolicitudesCambioHorario} from '../../components/solicitudes-cambio-horario/solicitudes-cambio-horario';


@Component({selector: 'app-gestion-cronogramas',
  standalone: true,
  imports: [CommonModule, FormsModule, Header, Modal, Toast, SolicitudesCambioHorario],
  templateUrl: './gestion-cronogramas.html',
  styleUrl: './gestion-cronogramas.css'
})
export class GestionCronogramas
  implements OnInit {

  isBrowser = false;

  tabActiva:
    'cronogramas' |
    'solicitudes' |
    'manual'
    = 'cronogramas';

  rolActual: Role | null = null;

  usuariosGestionables: User[] = [];
  horarios: Horario[] = [];

  mostrarFormulario = false;
  modoEdicion = false;
  usuarioEditandoId: number | null = null;

  guardando = false;
  usuarioEliminandoId: number | null = null;

  mostrarModalEliminar = false;

  cronogramaPendienteEliminar:
    CronogramaAgrupado | null = null;

  mensaje = '';
  error = '';

  diasDisponibles = [
    { valor: 'lunes', nombre: 'Lunes' },
    { valor: 'martes', nombre: 'Martes' },
    { valor: 'miercoles', nombre: 'Miércoles' },
    { valor: 'jueves', nombre: 'Jueves' },
    { valor: 'viernes', nombre: 'Viernes' },
    { valor: 'sabado', nombre: 'Sábado' },
    { valor: 'domingo', nombre: 'Domingo' }
  ];

  nuevoHorario: HorarioNuevo =
    this.crearFormularioVacio();

  constructor(
    private horarioService: HorarioService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID)
    private platformId: Object
  ) {
    this.isBrowser =
      isPlatformBrowser(this.platformId);
  }

  // =====================================================
  // INICIALIZACIÓN
  // =====================================================

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }

    const usuario =
      this.authService.getUser();

    this.rolActual =
      (usuario?.role as Role) || null;

    this.cargarUsuariosGestionables();
    this.cargarHorarios();
  }

  // =====================================================
  // TEXTOS SEGÚN ROL
  // =====================================================

  get nombrePanel(): string {
    switch (this.rolActual) {
      case 'admin':
        return 'Panel de administración';

      case 'rrhh':
        return 'Panel de Recursos Humanos';

      case 'supervisor':
        return 'Panel de supervisor';

      default:
        return 'Gestión de horarios';
    }
  }

  get destinatarioTexto(): string {
    switch (this.rolActual) {
      case 'rrhh':
        return 'supervisor';

      case 'supervisor':
        return 'empleado';

      default:
        return 'usuario';
    }
  }

  get destinatarioTextoPlural(): string {
    switch (this.rolActual) {
      case 'rrhh':
        return 'supervisores';

      case 'supervisor':
        return 'empleados';

      default:
        return 'usuarios';
    }
  }

  get tituloFormulario(): string {
    return this.modoEdicion
      ? 'Editar cronograma'
      : 'Nuevo cronograma';
  }

  get textoBotonGuardar(): string {
    if (this.guardando) {
      return this.modoEdicion
        ? 'Guardando cambios...'
        : 'Guardando...';
    }

    return this.modoEdicion
      ? 'Guardar cambios'
      : 'Guardar cronograma';
  }

  // =====================================================
  // TOAST
  // =====================================================

  get mostrarToast(): boolean {
    return Boolean(
      this.error || this.mensaje
    );
  }

  get mensajeToast(): string {
    return this.error || this.mensaje;
  }

  get tipoToast(): TipoToast {
    return this.error
      ? 'error'
      : 'success';
  }

  cerrarToast(): void {
    this.error = '';
    this.mensaje = '';
    this.cdr.detectChanges();
  }

  // =====================================================
  // TEXTO DEL MODAL
  // =====================================================

  get mensajeModalEliminar(): string {
    const grupo =
      this.cronogramaPendienteEliminar;

    if (!grupo) {
      return '';
    }

    return (
      '¿Querés eliminar el cronograma completo de ' +
      grupo.nombre +
      ' ' +
      grupo.apellido +
      '?'
    );
  }

  // =====================================================
  // AGRUPAR HORARIOS
  // =====================================================

  get horariosAgrupados():
    CronogramaAgrupado[] {

    const grupos:
      CronogramaAgrupado[] = [];

    for (const horario of this.horarios) {
      let grupo = grupos.find(
        (item) =>
          item.usuario_id ===
          horario.usuario_id
      );

      if (!grupo) {
        grupo = {
          usuario_id: horario.usuario_id,
          nombre: horario.nombre || '',
          apellido: horario.apellido || '',
          email: horario.email || '',
          role: horario.role,
          horarios: []
        };

        grupos.push(grupo);
      }

      grupo.horarios.push(horario);
    }

    for (const grupo of grupos) {
      grupo.horarios.sort(
        (a, b) =>
          this.ordenDia(a.dia_semana) -
          this.ordenDia(b.dia_semana)
      );
    }

    return grupos;
  }

  // =====================================================
  // CARGAR USUARIOS
  // =====================================================

  cargarUsuariosGestionables(): void {
    this.horarioService
      .getUsuariosGestionables()
      .subscribe({
        next: (usuarios) => {
          this.usuariosGestionables =
            usuarios;

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(
            'Error cargando usuarios:',
            err
          );

          this.error =
            err.error?.mensaje ||
            'No fue posible cargar los usuarios.';

          this.cdr.detectChanges();
        }
      });
  }

  // =====================================================
  // CARGAR HORARIOS
  // =====================================================

  cargarHorarios(): void {
    this.horarioService
      .getHorarios()
      .subscribe({
        next: (horarios) => {
          this.horarios = [
            ...horarios
          ];

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(
            'Error cargando horarios:',
            err
          );

          this.error =
            err.error?.mensaje ||
            'No fue posible cargar los cronogramas.';

          this.cdr.detectChanges();
        }
      });
  }

  // =====================================================
  // FORMULARIO
  // =====================================================

  crearFormularioVacio(): HorarioNuevo {
    return {
      usuario_id: null,
      dias_semana: [],
      hora_entrada: '',
      hora_salida: '',
      tolerancia_minutos: 10,
      modalidad: 'PRESENCIAL'
    };
  }

  abrirFormulario(): void {
    this.resetFormulario();
    this.mostrarFormulario = true;
    this.mensaje = '';
    this.error = '';
  }

  cerrarFormulario(): void {
    if (this.guardando) {
      return;
    }

    this.mostrarFormulario = false;
    this.resetFormulario();
  }

  resetFormulario(): void {
    this.nuevoHorario =
      this.crearFormularioVacio();

    this.modoEdicion = false;
    this.usuarioEditandoId = null;
  }

  // =====================================================
  // EDITAR
  // =====================================================

  editarCronograma(
    grupo: CronogramaAgrupado
  ): void {
    if (grupo.horarios.length === 0) {
      return;
    }

    const horarioBase =
      grupo.horarios[0];

    this.modoEdicion = true;
    this.usuarioEditandoId =
      grupo.usuario_id;

    this.nuevoHorario = {
      usuario_id: grupo.usuario_id,
      dias_semana:
        grupo.horarios.map(
          (horario) =>
            horario.dia_semana.toLowerCase()
        ),
      hora_entrada:
        horarioBase.hora_entrada.slice(0, 5),
      hora_salida:
        horarioBase.hora_salida.slice(0, 5),
      tolerancia_minutos:
        horarioBase.tolerancia_minutos,
      modalidad:
        horarioBase.modalidad
    };

    this.mensaje = '';
    this.error = '';
    this.mostrarFormulario = true;

    this.cdr.detectChanges();

    if (this.isBrowser) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }

  // =====================================================
  // DÍAS
  // =====================================================

  toggleDia(
    dia: string,
    seleccionado: boolean
  ): void {
    if (seleccionado) {
      if (
        !this.nuevoHorario
          .dias_semana.includes(dia)
      ) {
        this.nuevoHorario
          .dias_semana.push(dia);
      }

      return;
    }

    this.nuevoHorario.dias_semana =
      this.nuevoHorario
        .dias_semana
        .filter(
          (diaActual) =>
            diaActual !== dia
        );
  }

  seleccionarLaborables(): void {
    this.nuevoHorario.dias_semana = [
      'lunes',
      'martes',
      'miercoles',
      'jueves',
      'viernes'
    ];
  }

  seleccionarTodos(): void {
    this.nuevoHorario.dias_semana =
      this.diasDisponibles.map(
        (dia) => dia.valor
      );
  }

  // =====================================================
  // VALIDACIÓN
  // =====================================================

  validarFormulario(): boolean {
    if (!this.nuevoHorario.usuario_id) {
      this.error =
        `Debe seleccionar un ${this.destinatarioTexto}.`;

      return false;
    }

    if (
      this.nuevoHorario
        .dias_semana.length === 0
    ) {
      this.error =
        'Debe seleccionar al menos un día.';

      return false;
    }

    if (!this.nuevoHorario.hora_entrada) {
      this.error =
        'Debe ingresar la hora de entrada.';

      return false;
    }

    if (!this.nuevoHorario.hora_salida) {
      this.error =
        'Debe ingresar la hora de salida.';

      return false;
    }

    if (
      this.nuevoHorario.hora_entrada >=
      this.nuevoHorario.hora_salida
    ) {
      this.error =
        'La hora de salida debe ser posterior a la hora de entrada.';

      return false;
    }

    const tolerancia = Number(
      this.nuevoHorario
        .tolerancia_minutos
    );

    if (
      !Number.isInteger(tolerancia) ||
      tolerancia < 0 ||
      tolerancia > 240
    ) {
      this.error =
        'La tolerancia debe ser un número entero entre 0 y 240.';

      return false;
    }

    return true;
  }

  // =====================================================
  // GUARDAR
  // =====================================================

  guardarCronograma(): void {
    this.mensaje = '';
    this.error = '';

    if (!this.validarFormulario()) {
      this.cdr.detectChanges();
      return;
    }

    this.guardando = true;

    const peticion =
      this.modoEdicion &&
      this.usuarioEditandoId
        ? this.horarioService
            .updateCronogramaUsuario(
              this.usuarioEditandoId,
              this.nuevoHorario
            )
        : this.horarioService
            .createHorario(
              this.nuevoHorario
            );

    peticion
      .pipe(
        finalize(() => {
          this.guardando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (respuesta) => {
          this.mensaje =
            respuesta.mensaje;

          this.mostrarFormulario = false;
          this.resetFormulario();
          this.cargarHorarios();

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(
            'Error guardando cronograma:',
            err
          );

          this.error =
            err.error?.mensaje ||
            'No fue posible guardar el cronograma.';

          this.cdr.detectChanges();
        }
      });
  }

  // =====================================================
  // ABRIR MODAL
  // =====================================================

  eliminarCronograma(
    grupo: CronogramaAgrupado
  ): void {
    this.cronogramaPendienteEliminar =
      grupo;

    this.mostrarModalEliminar = true;
    this.mensaje = '';
    this.error = '';

    this.cdr.detectChanges();
  }

  // =====================================================
  // CERRAR MODAL
  // =====================================================

  cerrarModalEliminar(): void {
    if (this.usuarioEliminandoId) {
      return;
    }

    this.mostrarModalEliminar = false;

    this.cronogramaPendienteEliminar =
      null;

    this.cdr.detectChanges();
  }

  // =====================================================
  // CONFIRMAR ELIMINACIÓN
  // =====================================================

  confirmarEliminarCronograma(): void {
    const grupo =
      this.cronogramaPendienteEliminar;

    if (!grupo) {
      return;
    }

    this.usuarioEliminandoId =
      grupo.usuario_id;

    this.horarioService
      .deleteCronogramaUsuario(
        grupo.usuario_id
      )
      .pipe(
        finalize(() => {
          this.usuarioEliminandoId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (respuesta) => {
          this.horarios =
            this.horarios.filter(
              (horario) =>
                horario.usuario_id !==
                grupo.usuario_id
            );

          this.mensaje =
            respuesta.mensaje;

          this.mostrarModalEliminar = false;

          this.cronogramaPendienteEliminar =
            null;

          if (
            this.usuarioEditandoId ===
            grupo.usuario_id
          ) {
            this.mostrarFormulario = false;
            this.resetFormulario();
          }

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(
            'Error eliminando cronograma:',
            err
          );

          this.error =
            err.error?.mensaje ||
            'No fue posible eliminar el cronograma.';

          this.mostrarModalEliminar = false;

          this.cronogramaPendienteEliminar =
            null;

          this.cdr.detectChanges();
        }
      });
  }

  // =====================================================
  // PESTAÑAS
  // =====================================================

  cambiarTab(
    tab:
      'cronogramas' |
      'solicitudes' |
      'manual'
  ): void {
    this.tabActiva = tab;
  }

  // =====================================================
  // UTILIDADES
  // =====================================================

  ordenDia(dia: string): number {
    const orden:
      Record<string, number> = {
        lunes: 1,
        martes: 2,
        miercoles: 3,
        jueves: 4,
        viernes: 5,
        sabado: 6,
        domingo: 7
      };

    return orden[
      dia.toLowerCase()
    ] || 99;
  }

  mostrarDia(dia: string): string {
    const nombres:
      Record<string, string> = {
        lunes: 'Lunes',
        martes: 'Martes',
        miercoles: 'Miércoles',
        jueves: 'Jueves',
        viernes: 'Viernes',
        sabado: 'Sábado',
        domingo: 'Domingo'
      };

    return nombres[
      dia.toLowerCase()
    ] || dia;
  }

  obtenerIniciales(
    nombre: string,
    apellido: string
  ): string {
    return (
      nombre.charAt(0).toUpperCase() +
      apellido.charAt(0).toUpperCase()
    );
  }
}