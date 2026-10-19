import {Injectable, inject} from '@angular/core';
import { HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {User} from '../models/user.models';
import {environment} from '../../environments/environment';


@Injectable({providedIn: 'root'})
export class UserService {


  private http = inject(HttpClient);

  private apiUrl =
    `${environment.apiUrl}/users`;


  // ====================================================
  // GET
  // ====================================================

  getUsers():
    Observable<User[]> {

    return this.http.get<User[]>(
      this.apiUrl
    );

  }


  // ====================================================
  // POST
  // ====================================================

  createUser(
    user: User
  ): Observable<any> {

    return this.http.post(
      this.apiUrl,
      user
    );

  }


  // ====================================================
  // PUT
  // ====================================================

  updateUser(
    id: number,
    user: User
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/${id}`,
      user
    );

  }


  // ====================================================
  // DELETE
  // ====================================================

  deleteUser(
    id: number
  ): Observable<any> {

    return this.http.delete(
      `${this.apiUrl}/${id}`
    );

  }

}
