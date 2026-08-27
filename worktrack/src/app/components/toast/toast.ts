import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges
} from '@angular/core';

import { CommonModule } from '@angular/common';

export type TipoToast =
  'success' |
  'error' |
  'warning' |
  'info';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.css'
})
export class Toast
  implements OnChanges, OnDestroy {

  @Input() visible = false;
  @Input() mensaje = '';
  @Input() tipo: TipoToast = 'info';

  @Input() duracion = 4000;

  @Output() cerrar =
    new EventEmitter<void>();

  private temporizador:
    ReturnType<typeof setTimeout> | null
    = null;

  get icono(): string {
    switch (this.tipo) {
      case 'success':
        return 'bi-check-circle-fill';

      case 'error':
        return 'bi-exclamation-circle-fill';

      case 'warning':
        return 'bi-exclamation-triangle-fill';

      default:
        return 'bi-info-circle-fill';
    }
  }

  ngOnChanges(
    changes: SimpleChanges
  ): void {
    if (
      changes['visible'] ||
      changes['mensaje']
    ) {
      this.iniciarTemporizador();
    }
  }

  iniciarTemporizador(): void {
    this.limpiarTemporizador();

    if (
      !this.visible ||
      !this.mensaje ||
      this.duracion <= 0
    ) {
      return;
    }

    this.temporizador = setTimeout(
      () => {
        this.cerrarToast();
      },
      this.duracion
    );
  }

  cerrarToast(): void {
    this.limpiarTemporizador();
    this.cerrar.emit();
  }

  limpiarTemporizador(): void {
    if (this.temporizador) {
      clearTimeout(this.temporizador);
      this.temporizador = null;
    }
  }

  ngOnDestroy(): void {
    this.limpiarTemporizador();
  }
}