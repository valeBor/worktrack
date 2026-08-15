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

import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { Header } from '../../components/header/header';

import { User } from '../../models/user.models';

import {
  Horario,
  HorarioNuevo
} from '../../models/horario.model';

import { UserService } from '../../services/user-service';
import { HorarioService } from '../../services/horario.service';


@Component({
  selector: 'app-gestion-cronogramas',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    Header
  ],

  templateUrl: './gestion-cronogramas.html',
  styleUrl: './gestion-cronogramas.css'
})
export class GestionCronogramas implements OnInit {


  // =====================================================
  // SABER SI ESTAMOS EN EL NAVEGADOR
  // =====================================================

  isBrowser = false;


  // =====================================================
  // PESTAÑAS
  // =====================================================

  tabActiva:
    'cronogramas' |
    'solicitudes' |
    'manual'
    = 'cronogramas';


  // =====================================================
  // EMPLEADOS
  // =====================================================

  empleados: User[] = [];


  // =====================================================
  // HORARIOS
  // =====================================================

  horarios: Horario[] = [];


  // =====================================================
  // ESTADO DEL FORMULARIO
  // =====================================================

  mostrarFormulario = false;

  guardando = false;

  mensaje = '';

  error = '';


  // =====================================================
  // DÍAS DISPONIBLES
  // =====================================================

  diasDisponibles = [

    {
      valor: 'lunes',
      nombre: 'Lunes'
    },

    {
      valor: 'martes',
      nombre: 'Martes'
    },

    {
      valor: 'miercoles',
      nombre: 'Miércoles'
    },

    {
      valor: 'jueves',
      nombre: 'Jueves'
    },

    {
      valor: 'viernes',
      nombre: 'Viernes'
    },

    {
      valor: 'sabado',
      nombre: 'Sábado'
    },

    {
      valor: 'domingo',
      nombre: 'Domingo'
    }

  ];


  // =====================================================
  // NUEVO HORARIO
  // =====================================================

  nuevoHorario: HorarioNuevo = {

    usuario_id: null,

    dias_semana: [],

    hora_entrada: '',

    hora_salida: '',

    tolerancia_minutos: 10,

    modalidad: 'PRESENCIAL'

  };


  // =====================================================
  // CONTROL DEL MES MOSTRADO
  // =====================================================

  fechaMesActual = new Date(2026, 7, 1);


  get mesActual(): string {

    return new Intl.DateTimeFormat(
      'es-AR',
      {
        month: 'long',
        year: 'numeric'
      }
    ).format(this.fechaMesActual);

  }


  // =====================================================
  // MES ANTERIOR
  // =====================================================

  mesAnterior(): void {

    this.fechaMesActual = new Date(

      this.fechaMesActual.getFullYear(),

      this.fechaMesActual.getMonth() - 1,

      1

    );

  }


  // =====================================================
  // MES SIGUIENTE
  // =====================================================

  mesSiguiente(): void {

    this.fechaMesActual = new Date(

      this.fechaMesActual.getFullYear(),

      this.fechaMesActual.getMonth() + 1,

      1

    );

  }


  // =====================================================
  // AGRUPAR HORARIOS POR EMPLEADO
  // =====================================================

  get horariosAgrupados(): any[] {

    const grupos: any[] = [];


    for (const horario of this.horarios) {


      // Buscar si el empleado ya fue agregado
      // al arreglo de grupos.

      let grupo = grupos.find(

        (item) =>
          item.usuario_id === horario.usuario_id

      );


      // Si todavía no existe,
      // creamos el grupo del empleado.

      if (!grupo) {

        grupo = {

          usuario_id:
            horario.usuario_id,

          nombre:
            horario.nombre || '',

          apellido:
            horario.apellido || '',

          email:
            horario.email || '',

          horarios: []

        };


        grupos.push(grupo);

      }


      // Agregar el horario al empleado.

      grupo.horarios.push(horario);

    }


    // ===================================================
    // ORDENAR LOS HORARIOS DE CADA EMPLEADO
    // ===================================================

    for (const grupo of grupos) {

      grupo.horarios.sort(

        (a: Horario, b: Horario) => {

          return (
            this.ordenDia(a.dia_semana)
            -
            this.ordenDia(b.dia_semana)
          );

        }

      );

    }


    return grupos;

  }


  // =====================================================
  // ORDEN DE LOS DÍAS
  // =====================================================

  ordenDia(dia: string): number {

    const orden: Record<string, number> = {

      lunes: 1,

      martes: 2,

      miercoles: 3,

      jueves: 4,

      viernes: 5,

      sabado: 6,

      domingo: 7

    };


    return orden[dia.toLowerCase()] || 99;

  }


  // =====================================================
  // INICIALES DEL EMPLEADO
  // =====================================================

  obtenerIniciales(
    nombre: string,
    apellido: string
  ): string {

    const inicialNombre =
      nombre
        ? nombre.charAt(0).toUpperCase()
        : '';


    const inicialApellido =
      apellido
        ? apellido.charAt(0).toUpperCase()
        : '';


    return (
      inicialNombre +
      inicialApellido
    );

  }


  // =====================================================
  // NOMBRE VISUAL DEL DÍA
  // =====================================================

  mostrarDia(dia: string): string {

    const nombres: Record<string, string> = {

      lunes: 'Lunes',

      martes: 'Martes',

      miercoles: 'Miércoles',

      jueves: 'Jueves',

      viernes: 'Viernes',

      sabado: 'Sábado',

      domingo: 'Domingo'

    };


    return nombres[dia.toLowerCase()] || dia;

  }


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(

    private userService: UserService,

    private horarioService: HorarioService,

    private cdr: ChangeDetectorRef,

    @Inject(PLATFORM_ID)
    private platformId: Object

  ) {

    this.isBrowser =
      isPlatformBrowser(this.platformId);

  }


  // =====================================================
  // ON INIT
  // =====================================================

  ngOnInit(): void {

    // Evitar consultas HTTP protegidas
    // durante SSR.

    if (!this.isBrowser) {

      return;

    }


    this.cargarEmpleados();

    this.cargarHorarios();

  }


  // =====================================================
  // CARGAR EMPLEADOS
  // =====================================================

  cargarEmpleados(): void {

    if (!this.isBrowser) {

      return;

    }


    this.userService
      .getUsers()
      .subscribe({

        next: (usuarios) => {

          // Solo empleados activos.

          this.empleados =
            usuarios.filter(

              (usuario) =>
                usuario.role === 'empleado'
                &&
                Boolean(usuario.estado)

            );


          console.log(
            'Empleados cargados:',
            this.empleados
          );

        },


        error: (error) => {

          console.error(
            'Error al cargar empleados:',
            error
          );

        }

      });

  }


  // =====================================================
  // CARGAR HORARIOS
  // =====================================================

  cargarHorarios(): void {

    if (!this.isBrowser) {

      return;

    }


    this.horarioService
      .getHorarios()
      .subscribe({

        next: (data) => {

          this.horarios = data;


          console.log(
            'Horarios cargados:',
            data
          );

        },


        error: (error) => {

          console.error(
            'Error al cargar horarios:',
            error
          );

        }

      });

  }


  // =====================================================
  // SELECCIONAR / DESELECCIONAR DÍA
  // =====================================================

  toggleDia(
    dia: string,
    seleccionado: boolean
  ): void {

    if (seleccionado) {

      if (
        !this.nuevoHorario
          .dias_semana
          .includes(dia)
      ) {

        this.nuevoHorario
          .dias_semana
          .push(dia);

      }

    } else {

      this.nuevoHorario.dias_semana =

        this.nuevoHorario
          .dias_semana
          .filter(

            (diaActual) =>
              diaActual !== dia

          );

    }

  }


  // =====================================================
  // SELECCIONAR LUNES A VIERNES
  // =====================================================

  seleccionarLaborables(): void {

    this.nuevoHorario.dias_semana = [

      'lunes',

      'martes',

      'miercoles',

      'jueves',

      'viernes'

    ];

  }


  // =====================================================
  // SELECCIONAR TODOS
  // =====================================================

  seleccionarTodos(): void {

    this.nuevoHorario.dias_semana =

      this.diasDisponibles.map(

        (dia) =>
          dia.valor

      );

  }


  // =====================================================
  // CAMBIAR PESTAÑA
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
  // ABRIR FORMULARIO
  // =====================================================

  abrirFormulario(): void {

    this.mostrarFormulario = true;

    this.mensaje = '';

    this.error = '';

  }


  // =====================================================
  // CERRAR FORMULARIO
  // =====================================================

  cerrarFormulario(): void {

    this.mostrarFormulario = false;

    this.resetFormulario();

  }


  // =====================================================
  // LIMPIAR FORMULARIO
  // =====================================================

  resetFormulario(): void {

    this.nuevoHorario = {

      usuario_id: null,

      dias_semana: [],

      hora_entrada: '',

      hora_salida: '',

      tolerancia_minutos: 10,

      modalidad: 'PRESENCIAL'

    };

  }


  // =====================================================
  // GUARDAR CRONOGRAMA
  // =====================================================

  guardarCronograma(): void {

    this.mensaje = '';

    this.error = '';


    // ===================================================
    // VALIDAR EMPLEADO
    // ===================================================

    if (!this.nuevoHorario.usuario_id) {

      this.error =
        'Debe seleccionar un empleado';

      return;

    }


    // ===================================================
    // VALIDAR DÍAS
    // ===================================================

    if (
      this.nuevoHorario
        .dias_semana
        .length === 0
    ) {

      this.error =
        'Debe seleccionar al menos un día';

      return;

    }


    // ===================================================
    // VALIDAR HORA ENTRADA
    // ===================================================

    if (!this.nuevoHorario.hora_entrada) {

      this.error =
        'Debe ingresar la hora de entrada';

      return;

    }


    // ===================================================
    // VALIDAR HORA SALIDA
    // ===================================================

    if (!this.nuevoHorario.hora_salida) {

      this.error =
        'Debe ingresar la hora de salida';

      return;

    }


    // ===================================================
    // VALIDAR ORDEN DE HORAS
    // ===================================================

    if (
      this.nuevoHorario.hora_entrada
      >=
      this.nuevoHorario.hora_salida
    ) {

      this.error =
        'La hora de salida debe ser posterior a la hora de entrada';

      return;

    }


    // ===================================================
    // COMENZAMOS EL GUARDADO
    // ===================================================

    this.guardando = true;


    // ===================================================
    // POST
    // ===================================================

    this.horarioService
      .createHorario(
        this.nuevoHorario
      )
      .pipe(

        finalize(() => {

          this.guardando = false;

          this.cdr.detectChanges();

        })

      )
      .subscribe({

        // ===============================================
        // ÉXITO
        // ===============================================

        next: (respuesta) => {

          this.mensaje =
            respuesta.mensaje
            ||
            'Cronograma creado correctamente';


          // Recargar horarios
          // para actualizar las tarjetas.

          this.cargarHorarios();


          // Limpiar formulario.

          this.resetFormulario();


          // Cerrar formulario.

          this.mostrarFormulario = false;


          this.cdr.detectChanges();

        },


        // ===============================================
        // ERROR
        // ===============================================

        error: (err) => {

          console.error(
            'Error creando cronograma:',
            err
          );


          this.error =

            err.error?.mensaje

            ||

            err.error?.message

            ||

            'No fue posible crear el cronograma';


          this.cdr.detectChanges();

        }

      });

  }

}