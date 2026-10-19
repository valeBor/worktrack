import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

import {QrResponse} from '../models/qr.model';
import {environment} from '../../environments/environment';
import {AuthService} from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class QrService {
  private readonly apiUrl =
    environment.qrUrl;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  getQr(): Observable<QrResponse> {
    return this.http.get<QrResponse>(
      `${this.apiUrl}/${this.auth.getRole() === 'kiosk' ? 'generar-kiosco' : 'generar'}`
    );
  }
}
