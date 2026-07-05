import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserPort } from '@/core/ports/user.port';
import { User } from '@/core/domain/user.model';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class UserHttpAdapter extends UserPort {
  private base = `${environment.apiUrl}/api/users`;

  constructor(private http: HttpClient) {
    super();
  }

  getById(id: number): Observable<User> {
    return this.http.get<User>(`${this.base}/${id}`);
  }

  edit(user: User): Observable<void> {
    return this.http.patch<void>(`${this.base}/edit`, user);
  }
}
