import {Component, inject, Input, OnInit, PLATFORM_ID, signal} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {HttpErrorResponse} from '@angular/common/http';
import {Modal} from '../modal/modal';
import {AlertItem} from '../../models/alert.model';
import {AlertService} from '../../services/alert.service';

@Component({
  selector: 'app-alert-panel',
  standalone: true,
  imports: [Modal],
  templateUrl: './alert-panel.html',
  styleUrl: './alert-panel.css'
})
export class AlertPanel implements OnInit {
  @Input() title = 'Mis alertas';

  readonly preview = signal<AlertItem[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly modalOpen = signal(false);
  readonly modalAlerts = signal<AlertItem[]>([]);
  readonly modalLoading = signal(false);
  readonly modalError = signal('');
  readonly currentPage = signal(1);
  readonly totalPages = signal(0);

  private readonly alertService = inject(AlertService);
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadPreview();
    }
  }

  loadPreview(): void {
    this.loading.set(true);
    this.error.set('');

    this.alertService.getAlerts(1, 3).subscribe({
      next: response => {
        this.preview.set(response.alertas);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.getErrorMessage(error));
        this.loading.set(false);
      }
    });
  }

  openAll(): void {
    this.modalOpen.set(true);
    this.loadPage(1);
  }

  closeAll(): void {
    this.modalOpen.set(false);
  }

  loadPage(page: number): void {
    if (page < 1 || this.modalLoading()) return;

    this.modalLoading.set(true);
    this.modalError.set('');

    this.alertService.getAlerts(page, 10).subscribe({
      next: response => {
        this.modalAlerts.set(response.alertas);
        this.currentPage.set(response.pagina);
        this.totalPages.set(response.total_paginas);
        this.total.set(response.total);
        this.modalLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.modalError.set(this.getErrorMessage(error));
        this.modalLoading.set(false);
      }
    });
  }

  formatDate(date: string): string {
    const [year, month, day] = date.split('-');
    return year && month && day ? `${day}/${month}/${year}` : date;
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    return error.error?.mensaje ||
      error.error?.message ||
      'No se pudieron cargar las alertas.';
  }
}