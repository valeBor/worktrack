import {ChangeDetectorRef,Component,Inject,OnDestroy,OnInit, PLATFORM_ID} from '@angular/core';
import {CommonModule,isPlatformBrowser} from '@angular/common';
import {Subject,takeUntil} from 'rxjs';
import {QrService} from '../../services/qr.service';
import {QrResponse} from '../../models/qr.model';

@Component({
  selector: 'app-qr-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-admin.html',
  styleUrl: './qr-admin.css'
})
export class QrAdmin
  implements OnInit, OnDestroy {

  qrImage = '';
  loading = false;
  error = '';
  secondsRemaining = 0;

  private refreshTimer?:
    ReturnType<typeof setTimeout>;

  private countdownTimer?:
    ReturnType<typeof setInterval>;

  private readonly destroy$ =
    new Subject<void>();

  constructor(
    private qrService: QrService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID)
    private platformId: Object
  ) {}

  ngOnInit(): void {
    if (
      !isPlatformBrowser(this.platformId)
    ) {
      return;
    }

    this.loadQr();
  }

  // ====================================================
  // CARGAR QR DESDE EL BACKEND
  // ====================================================

  loadQr(): void {
    if (this.loading) {
      return;
    }

    this.clearTimers();

    this.loading = true;
    this.error = '';

    this.qrService
      .getQr()
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: response => {
          this.loading = false;
          this.qrImage = response.imagen;

          this.startTimers(response);
          this.cdr.detectChanges();
        },
        error: err => {
          this.loading = false;
          this.qrImage = '';
          this.secondsRemaining = 0;

          this.error =
            err.error?.mensaje ||
            'No fue posible generar el código QR.';

          this.scheduleRetry();
          this.cdr.detectChanges();
        }
      });
  }

  // ====================================================
  // CONTADOR Y RENOVACIÓN AUTOMÁTICA
  // ====================================================

  private startTimers(
    response: QrResponse
  ): void {
    const expirationTime =
      new Date(
        response.expira_en
      ).getTime();

    if (
      !Number.isFinite(expirationTime)
    ) {
      this.secondsRemaining =
        response.duracion_segundos;

      this.scheduleRetry();
      return;
    }

    const updateCountdown = () => {
      const remainingMilliseconds =
        expirationTime - Date.now();

      this.secondsRemaining = Math.max(
        0,
        Math.ceil(
          remainingMilliseconds / 1000
        )
      );

      this.cdr.detectChanges();
    };

    updateCountdown();

    this.countdownTimer = setInterval(
      updateCountdown,
      1000
    );

    const refreshDelay = Math.max(
      expirationTime -
        Date.now() -
        10000,
      5000
    );

    this.refreshTimer = setTimeout(
      () => this.loadQr(),
      refreshDelay
    );
  }

  // ====================================================
  // REINTENTAR EN CASO DE ERROR
  // ====================================================

  private scheduleRetry(): void {
    this.refreshTimer = setTimeout(
      () => this.loadQr(),
      10000
    );
  }

  // ====================================================
  // LIMPIAR TEMPORIZADORES
  // ====================================================

  private clearTimers(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }

    if (this.countdownTimer) {
      clearInterval(
        this.countdownTimer
      );

      this.countdownTimer = undefined;
    }
  }

  ngOnDestroy(): void {
    this.clearTimers();

    this.destroy$.next();
    this.destroy$.complete();
  }
}