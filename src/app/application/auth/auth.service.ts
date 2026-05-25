import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthPort } from '../../core/ports/auth.port';
import { SignInRequest, SignUpRequest } from '../../core/domain/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  isLoggedIn = signal(this.checkValidToken());

  constructor(
    private authPort: AuthPort,
    private router: Router,
  ) {
    this.checkAndEvictExpiredToken();
  }

  signIn(request: SignInRequest): Observable<string> {
    return this.authPort.signIn(request).pipe(
      tap((token) => {
        localStorage.setItem(this.TOKEN_KEY, token);
        this.isLoggedIn.set(true);
      }),
    );
  }

  signUp(request: SignUpRequest): Observable<string> {
    return this.authPort.signUp(request).pipe(
      tap((token) => {
        localStorage.setItem(this.TOKEN_KEY, token);
        this.isLoggedIn.set(true);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.isLoggedIn.set(false);
    this.router.navigate(['/sign-in']);
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return null;
    if (this.isTokenExpired(token)) {
      this.logout();
      return null;
    }
    return token;
  }

  getUserIdFromToken(): number | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = this.decodePayload(token);
      const sub = payload?.['sub'] ?? payload?.['id'] ?? payload?.['userId'];
      if (sub == null) return null;
      return Number(sub);
    } catch {
      return null;
    }
  }

  private checkValidToken(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  private checkAndEvictExpiredToken(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token && this.isTokenExpired(token)) {
      localStorage.removeItem(this.TOKEN_KEY);
      this.isLoggedIn.set(false);
    }
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodePayload(token);
      if (!payload?.['exp']) return false;
      return Date.now() >= payload['exp'] * 1000;
    } catch {
      return true;
    }
  }

  private decodePayload(token: string): Record<string, number> | null {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }
}
