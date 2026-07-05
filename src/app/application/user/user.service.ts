import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserPort } from '@/core/ports/user.port';
import { User } from '@/core/domain/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private userPort: UserPort) {}

  getById(id: number): Observable<User> {
    return this.userPort.getById(id);
  }

  edit(user: User): Observable<void> {
    return this.userPort.edit(user);
  }
}
