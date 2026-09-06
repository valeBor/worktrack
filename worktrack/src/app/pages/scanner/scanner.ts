import {Component,ElementRef,NgZone,OnDestroy,ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BrowserQRCodeReader,IScannerControls} from '@zxing/browser';
import {Header} from '../../components/header/header';
import {AsistenciaService} from '../../services/asistecia.service';
import {TipoRegistro} from '../../models/asistencia.model';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [CommonModule,Header],
  templateUrl: './scanner.html',
  styleUrl: './scanner.css'
})
export class Scanner implements OnDestroy {
  @ViewChild('video')
  video!: ElementRef<HTMLVideoElement>;

  tipoRegistro: TipoRegistro = 'entrada';

  scannerActivo = false;
  procesando = false;

  mensaje = '';
  error = '';

  private readonly codeReader =
    new BrowserQRCodeReader();

  private controls?: IScannerControls;
  private yaLeido = false;

  constructor(
    private asistenciaService:
      AsistenciaService,
    private ngZone: NgZone
  ) {}

  // ====================================================
  // SELECCIONAR TIPO
  // ====================================================

  seleccionarTipo(
    tipo: TipoRegistro
  ): void {
    if (
      this.scannerActivo ||
      this.procesando
    ) {
      return;
    }

    this.tipoRegistro = tipo;
  }

  // ====================================================
  // ACTIVAR CÁMARA
  // ====================================================

  async activarCamara(): Promise<void> {
    if (
      this.scannerActivo ||
      this.procesando
    ) {
      return;
    }

    this.mensaje = '';
    this.error = '';
    this.yaLeido = false;
    this.scannerActivo = true;

    try {
      const constraints:
        MediaStreamConstraints = {
          audio: false,
          video: {
            facingMode: {
              ideal: 'environment'
            },
            width: {
              ideal: 1280
            },
            height: {
              ideal: 720
            }
          }
        };

      this.controls =
        await this.codeReader
          .decodeFromConstraints(
            constraints,
            this.video.nativeElement,
            result => {
              if (
                !result ||
                this.yaLeido
              ) {
                return;
              }

              this.ngZone.run(() => {
                this.yaLeido = true;

                const textoQR =
                  result.getText();

                this.detenerCamara();
                this.procesarQR(textoQR);
              });
            }
          );
    } catch (error) {
      console.error(
        'Error al activar la cámara:',
        error
      );

      this.error =
        'No se pudo activar la cámara. Verificá los permisos del navegador.';

      this.detenerCamara();
    }
  }

  // ====================================================
  // PROCESAR CONTENIDO DEL QR
  // ====================================================

  procesarQR(textoQR: string): void {
    const token =
      this.obtenerToken(textoQR);

    if (!token) {
      this.error =
        'El código leído no corresponde a un QR válido de WorkTrack.';

      this.mensaje = '';
      return;
    }

    this.registrarAsistencia(token);
  }

  // ====================================================
  // OBTENER TOKEN DEL QR
  // ====================================================

  private obtenerToken(
    textoQR: string
  ): string | null {
    const texto =
      String(textoQR || '').trim();

    if (!texto) {
      return null;
    }

    /*
     * Formato nuevo:
     * token firmado directamente.
     */
    const partesToken =
      texto.split('.');

    if (
      partesToken.length === 3 &&
      partesToken.every(Boolean)
    ) {
      return texto;
    }

    /*
     * Compatibilidad con el formato anterior:
     * {"token":"...","timestamp":...}
     */
    try {
      const datosQR =
        JSON.parse(texto);

      const token =
        String(
          datosQR?.token || ''
        ).trim();

      return token || null;
    } catch {
      return null;
    }
  }

  // ====================================================
  // REGISTRAR ASISTENCIA
  // ====================================================

  private registrarAsistencia(
    token: string
  ): void {
    this.procesando = true;
    this.mensaje = '';
    this.error = '';

    this.asistenciaService
      .registrarAsistencia({
        token,
        tipo: this.tipoRegistro
      })
      .subscribe({
        next: response => {
          this.procesando = false;

          this.mensaje =
            response.mensaje ||
            'Asistencia registrada correctamente.';

          this.error = '';
        },
        error: err => {
          this.procesando = false;

          this.error =
            err.error?.mensaje ||
            'No fue posible registrar la asistencia.';

          this.mensaje = '';
        }
      });
  }

  // ====================================================
  // DETENER CÁMARA
  // ====================================================

  detenerCamara(): void {
    if (this.controls) {
      this.controls.stop();
      this.controls = undefined;
    }

    const videoElement =
      this.video?.nativeElement;

    const mediaStream =
      videoElement?.srcObject as
        MediaStream | null;

    if (mediaStream) {
      mediaStream
        .getTracks()
        .forEach(track => {
          track.stop();
        });

      videoElement.srcObject = null;
    }

    this.scannerActivo = false;
  }

  // ====================================================
  // DESTRUIR COMPONENTE
  // ====================================================

  ngOnDestroy(): void {
    this.detenerCamara();
  }
}