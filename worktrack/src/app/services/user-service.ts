import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.models';

@Injectable({
  providedIn: 'root'
})

export class UserService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/api/users';



  // GET
  getUsers(): Observable<User[]> {

    return this.http.get<User[]>(this.apiUrl);

  }



  // POST
  createUser(user: User): Observable<User> {

    return this.http.post<User>(
      this.apiUrl,
      user
    );

  }



  // PUT
  updateUser(
    id: number,
    user: User
  ): Observable<User> {

    return this.http.put<User>(
      `${this.apiUrl}/${id}`,
      user
    );

  }



  // DELETE
  deleteUser(id: number): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );

  }

}