import {Component, EventEmitter, HostListener, Input, Output} from '@angular/core';
import { CommonModule } from '@angular/common';

export type TipoModal =
  'danger' |
  'warning' |
  'success' |
  'info';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrl: './modal.css'
})
export class Modal {
  @Input() visible = false;
  @Input() titulo = '';
  @Input() mensaje = '';

  @Input() tipo: TipoModal = 'info';

  @Input() textoConfirmar = 'Aceptar';
  @Input() textoCancelar = 'Cancelar';

  @Input() mostrarCancelar = true;
  @Input() procesando = false;

  @Output() confirmar =
    new EventEmitter<void>();

  @Output() cancelar =
    new EventEmitter<void>();

  get icono(): string {
    switch (this.tipo) {
      case 'danger':
        return 'bi-trash3';

      case 'warning':
        return 'bi-exclamation-triangle';

      case 'success':
        return 'bi-check-circle';

      default:
        return 'bi-info-circle';
    }
  }

  confirmarAccion(): void {
    if (this.procesando) {
      return;
    }

    this.confirmar.emit();
  }

  cancelarAccion(): void {
    if (this.procesando) {
      return;
    }

    this.cancelar.emit();
  }

  cerrarDesdeFondo(
    event: MouseEvent
  ): void {
    if (
      event.target ===
      event.currentTarget
    ) {
      this.cancelarAccion();
    }
  }

  @HostListener(
    'document:keydown.escape'
  )
  cerrarConEscape(): void {
    if (
      this.visible &&
      !this.procesando
    ) {
      this.cancelarAccion();
    }
  }
}