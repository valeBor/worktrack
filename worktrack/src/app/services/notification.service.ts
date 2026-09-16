import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import { NotificationCountResponse, NotificationListResponse,
     MarkNotificationResponse, MarkAllNotificationsResponse } from '../models/notification.model';

@Injectable({providedIn: 'root'})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/notificaciones`;

  getNotifications(pagina = 1, limite = 10): Observable<NotificationListResponse> {
    const params = new HttpParams()
      .set('pagina', pagina)
      .set('limite', limite);

    return this.http.get<NotificationListResponse>(this.api, {params});
  }

  getUnreadCount(): Observable<NotificationCountResponse> {
    return this.http.get<NotificationCountResponse>(`${this.api}/contador`);
  }

  markAsRead(id: number): Observable<MarkNotificationResponse> {
    return this.http.patch<MarkNotificationResponse>(
      `${this.api}/${id}/leida`,
      {}
    );
  }

  markAllAsRead(): Observable<MarkAllNotificationsResponse> {
    return this.http.patch<MarkAllNotificationsResponse>(
      `${this.api}/leer-todas`,
      {}
    );
  }
}