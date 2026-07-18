import { Observable } from 'rxjs';
import { SignInRequest, SignUpRequest } from '../domain/user.model';

export abstract class IAuthService {
  abstract signIn(request: SignInRequest): Observable<string>;
  abstract signUp(request: SignUpRequest): Observable<string>;
}
