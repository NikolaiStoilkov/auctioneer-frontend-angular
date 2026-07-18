import { Injectable } from '@angular/core';
import { User } from '../../core/domain/user.model';
import { HttpClient } from '@angular/common/http';
import * as variables from '@env/environment.development';

@Injectable({ providedIn: 'root' })
export class UserService {
  private base = `${variables.environment.API_URL}/api/users`;

  constructor (private http: HttpClient) {
  }

  getById (id: number) {
    return this.http.get<User>(`${this.base}/${id}`);
  }

  edit (user: User) {
    return this.http.patch<void>(`${this.base}/edit`, user);
  }
}
