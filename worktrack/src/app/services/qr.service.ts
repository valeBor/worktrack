import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

import {QrResponse} from '../models/qr.model';

@Injectable({
  providedIn: 'root'
})
export class QrService {
  private readonly apiUrl =
    'http://localhost:3000/qr';

  constructor(
    private http: HttpClient
  ) {}

  getQr(): Observable<QrResponse> {
    return this.http.get<QrResponse>(
      `${this.apiUrl}/generar`
    );
  }
}