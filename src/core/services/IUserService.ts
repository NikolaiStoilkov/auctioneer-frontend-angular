import { Observable } from 'rxjs';
import { User } from '../domain/user.model';

export abstract class IUserService {
  abstract getById(id: number): Observable<User>;
  abstract edit(user: User): Observable<void>;
}
