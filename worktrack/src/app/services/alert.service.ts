import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {AlertListResponse} from '../models/alert.model';

@Injectable({providedIn: 'root'})
export class AlertService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/alertas`;

  getAlerts(pagina = 1, limite = 10): Observable<AlertListResponse> {
    const params = new HttpParams()
      .set('pagina', pagina)
      .set('limite', limite);

    return this.http.get<AlertListResponse>(this.api, {params});
  }
}