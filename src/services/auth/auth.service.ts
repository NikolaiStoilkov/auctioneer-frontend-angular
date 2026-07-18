import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { SignInRequest, SignUpRequest } from '../../core/domain/user.model';
import { HttpClient } from '@angular/common/http';
import * as variables from '@env/environment.development';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = `${variables.environment.API_URL}/api/auth`;
  private readonly TOKEN_KEY = 'auth_token';
  isLoggedIn = signal(this.checkValidToken());

  constructor (
    private http: HttpClient,
    private router: Router
  ) {
    this.checkAndEvictExpiredToken();
  }

  signIn (request: SignInRequest){
    return this.http.post(`${this.base}/sign-in`, request, {
      responseType: 'text'
    }).pipe(
      tap((token) => {
        localStorage.setItem(this.TOKEN_KEY, token);
        this.isLoggedIn.set(true);
      })
    );
  }

  signUp (request: SignUpRequest) {
    return this.http.post(`${this.base}/sign-up`, request, {
      responseType: 'text'
    }).pipe(
      tap((token) => {
        localStorage.setItem(this.TOKEN_KEY, token);
        this.isLoggedIn.set(true);
      })
    );
  }

  logout () {
    localStorage.removeItem(this.TOKEN_KEY);
    this.isLoggedIn.set(false);
    this.router.navigate(['/sign-in']);
  }

  getToken (){
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      return null;
    }
    if (this.isTokenExpired(token)) {
      this.logout();
      return null;
    }
    return token;
  }

  getUserIdFromToken () {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    try {
      const payload = this.decodePayload(token);
      const sub = payload?.['sub'] ?? payload?.['id'] ?? payload?.['userId'];
      if (sub == null) {
        return null;
      }
      return Number(sub);
    } catch {
      return null;
    }
  }

  private checkValidToken () {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      return false;
    }
    return !this.isTokenExpired(token);
  }

  private checkAndEvictExpiredToken () {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token && this.isTokenExpired(token)) {
      localStorage.removeItem(this.TOKEN_KEY);
      this.isLoggedIn.set(false);
    }
  }

  isTokenExpired (token: string) {
    try {
      const payload = this.decodePayload(token);
      if (!payload?.['exp']) {
        return false;
      }
      return Date.now() >= payload['exp'] * 1000;
    } catch {
      return true;
    }
  }

  private decodePayload (token: string): Record<string, number> | null {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }
}
