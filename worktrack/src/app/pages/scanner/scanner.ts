import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, ViewChild, ViewEncapsulation} from '@angular/core';
//libreria que lee, libreria para escanear qr
import {BrowserQRCodeReader, IScannerControls} from '@zxing/browser';
//import { Router } from '@angular/router';
import { AsistenciaService } from '../../services/asistecia.service';
import { TipoRegistro } from '../../models/asistencia.model';
import { Header } from '../../components/header/header';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [CommonModule, Header],
  templateUrl: './scanner.html',
  styleUrl: './scanner.css',

  // Sin encapsulación de estilos.
  // Se deja así porque ayudó a que el diseño de la cámara quede correctamente centrado.
  // Importante: usar clases específicas para no afectar otros componentes.
  encapsulation: ViewEncapsulation.None
})
export class Scanner implements OnDestroy {

  // Captura el elemento <video #video> del HTML.
  // Ese video muestra la cámara en vivo.
  @ViewChild('video')
  video!: ElementRef<HTMLVideoElement>;

  // Tipo de asistencia seleccionado por el empleado.
  tipoRegistro: TipoRegistro = 'entrada';

  // Controla si la cámara está activa o no.
  scannerActivo = false;

  // Mensajes que se muestran en pantalla.
  mensaje = '';
  error = '';

  // Lector QR de la librería ZXing.
  private codeReader = new BrowserQRCodeReader();

  // Controles del scanner. Permiten detener la cámara.
  private controls?: IScannerControls;

  // Evita que el mismo QR se lea muchas veces seguidas.
  private yaLeido = false;

  constructor(
    private asistenciaService: AsistenciaService
  ) {}

  // Cambia entre entrada y salida.
  seleccionarTipo(tipo: TipoRegistro): void {
    this.tipoRegistro = tipo;
  }

  // Activa la cámara y comienza a buscar códigos QR.
  async activarCamara(): Promise<void> {
    this.mensaje = '';
    this.error = '';
    this.yaLeido = false;
    this.scannerActivo = true;

    try {
      this.controls = await this.codeReader.decodeFromVideoDevice(
        undefined,
        this.video.nativeElement,
        (result) => {
          if (result && !this.yaLeido) {
            this.yaLeido = true;

            const textoQR = result.getText();

            console.log('QR leído:', textoQR);

            this.procesarQR(textoQR);

            this.detenerCamara();
          }
        }
      );

    } catch (err) {
      console.error(err);

      this.error = 'No se pudo activar la cámara. Verificá permisos.';
      this.scannerActivo = false;
    }
  }

  // Procesa el texto leído del QR.
  // El QR generado por el backend contiene un JSON:
  // { token: "...", timestamp: ... }
  procesarQR(textoQR: string): void {
    try {
      const datosQR = JSON.parse(textoQR);

      if (!datosQR.token) {
        this.error = 'El QR no contiene un token válido.';
        return;
      }

      this.registrarAsistencia(datosQR.token);

    } catch (error) {
      console.error(error);
      this.error = 'El QR leído no tiene formato válido.';
    }
  }

  // Envía token QR + tipo entrada/salida al backend mediante el service.
  registrarAsistencia(token: string): void {
    const data = {
      token,
      tipo: this.tipoRegistro
    };

    this.asistenciaService.registrarAsistencia(data).subscribe({
      next: (resp) => {
        this.mensaje = resp.mensaje || 'Asistencia registrada correctamente.';
        this.error = '';
      },
      error: (err) => {
        console.error(err);

        this.error = err.error?.mensaje || 'Error al registrar asistencia.';
        this.mensaje = '';
      }
    });
  }

  // Detiene la cámara y libera el dispositivo.
  detenerCamara(): void {
    if (this.controls) {
      this.controls.stop();
      this.controls = undefined;
    }

    this.scannerActivo = false;
  }

  // Cuando salimos del componente, se apaga la cámara.
  ngOnDestroy(): void {
    this.detenerCamara();
  }
}