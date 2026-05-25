import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthPort } from '../../core/ports/auth.port';
import { SignInRequest, SignUpRequest } from '../../core/domain/user.model';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class AuthHttpAdapter extends AuthPort {
  private base = `${environment.apiUrl}/api/auth`;

  constructor(private http: HttpClient) {
    super();
  }

  signIn(request: SignInRequest): Observable<string> {
    return this.http.post(`${this.base}/sign-in`, request, { responseType: 'text' });
  }

  signUp(request: SignUpRequest): Observable<string> {
    return this.http.post(`${this.base}/sign-up`, request, { responseType: 'text' });
  }
}
