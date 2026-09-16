import {ChangeDetectorRef, Component, ElementRef, HostListener,Inject,
  Input, OnDestroy, OnInit, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser, Location} from '@angular/common';
import {Router} from '@angular/router';
import {Subscription, timer} from 'rxjs';
import {AuthService} from '../../services/auth.service';
import {NotificationService} from '../../services/notification.service';
import {NotificationItem} from '../../models/notification.model';
import {Role} from '../../models/user.models';
import {Toast, TipoToast} from '../toast/toast';

@Component({
  selector: 'app-header',
  imports: [Toast],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit, OnDestroy {
  @Input() titulo = 'WorkTrack';
  @Input() cantidadNotificaciones = 0;
  @Input() mostrarVolver = false;

  fecha = '';
  role: Role | '' = '';
  totalNoLeidas = 0;
  notificaciones: NotificationItem[] = [];
  panelAbierto = false;
  cargando = false;
  errorListado = '';
  notificacionEnProceso: number | null = null;
  marcandoTodas = false;
  toastVisible = false;
  toastMensaje = '';
  toastTipo: TipoToast = 'info';

  private actualizacion?: Subscription;
  private readonly formatoFecha = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  constructor(
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
    private readonly router: Router,
    private readonly location: Location,
    private readonly elementRef: ElementRef<HTMLElement>,
    private readonly changeDetectorRef: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

  ngOnInit(): void {
    this.fecha = new Date().toLocaleDateString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    if (!isPlatformBrowser(this.platformId)) return;

    this.role = (this.authService.getRole() as Role) || '';

    this.actualizacion = timer(0, 60000).subscribe(() => {
      this.cargarContador();
      if (this.panelAbierto) this.cargarNotificaciones();
    });
  }

  ngOnDestroy(): void {
    this.actualizacion?.unsubscribe();
  }

  cargarContador(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (respuesta) => {
        this.totalNoLeidas = respuesta.total_no_leidas;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        if (this.panelAbierto) {
          this.mostrarToast('No se pudo actualizar el contador de notificaciones.', 'error');
        }
      }
    });
  }

  cargarNotificaciones(): void {
    this.cargando = true;
    this.errorListado = '';
    this.changeDetectorRef.markForCheck();

    this.notificationService.getNotifications().subscribe({
      next: (respuesta) => {
        this.notificaciones = respuesta.notificaciones;
        this.totalNoLeidas = respuesta.total_no_leidas;
        this.cargando = false;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.errorListado = 'No se pudieron cargar las notificaciones.';
        this.cargando = false;
        this.changeDetectorRef.markForCheck();
      }
    });
  }

  alternarPanel(): void {
    this.panelAbierto = !this.panelAbierto;
    if (this.panelAbierto) this.cargarNotificaciones();
  }

  marcarComoLeida(notificacion: NotificationItem): void {
    if (notificacion.leido || this.notificacionEnProceso !== null || this.marcandoTodas) return;

    this.notificacionEnProceso = notificacion.id;

    this.notificationService.markAsRead(notificacion.id).subscribe({
      next: () => {
        this.notificacionEnProceso = null;
        this.cargarNotificaciones();
        this.cargarContador();
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.notificacionEnProceso = null;
        this.mostrarToast('No se pudo marcar la notificación como leída.', 'error');
      }
    });
  }

  marcarTodasComoLeidas(): void {
    if (this.totalNoLeidas === 0 || this.marcandoTodas || this.notificacionEnProceso !== null) return;

    this.marcandoTodas = true;

    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.marcandoTodas = false;
        this.cargarNotificaciones();
        this.cargarContador();
        this.mostrarToast('Todas las notificaciones fueron marcadas como leídas.', 'success');
      },
      error: () => {
        this.marcandoTodas = false;
        this.mostrarToast('No se pudieron marcar las notificaciones como leídas.', 'error');
      }
    });
  }

  formatearFecha(fecha: string): string {
    const valor = new Date(fecha);
    return Number.isNaN(valor.getTime()) ? '' : this.formatoFecha.format(valor);
  }

  mostrarToast(mensaje: string, tipo: TipoToast): void {
    this.toastMensaje = mensaje;
    this.toastTipo = tipo;
    this.toastVisible = true;
    this.changeDetectorRef.markForCheck();
  }

  @HostListener('document:click', ['$event'])
  cerrarAlHacerClickFuera(evento: MouseEvent): void {
    if (
      this.panelAbierto &&
      !this.elementRef.nativeElement.contains(evento.target as Node)
    ) {
      this.panelAbierto = false;
    }
  }

  @HostListener('document:keydown.escape')
  cerrarConEscape(): void {
    this.panelAbierto = false;
  }

  volver(): void {
    this.location.back();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}