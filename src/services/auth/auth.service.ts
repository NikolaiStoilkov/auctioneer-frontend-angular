import { tap } from 'rxjs';

import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';

import { SignInRequest, SignUpRequest } from '../../core/domain/user.model';
import { AUTH_API } from '../../core/config/auth.api';

/**
 * Manages authentication state for the application.
 *
 * Signs users in/up against the auth API, stores the received JWT in
 * `localStorage`, and exposes the login state as a signal. The token's
 * payload is decoded client-side to read the user id and expiry;
 * expired tokens are evicted automatically.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = AUTH_API;
  private readonly TOKEN_KEY = 'auth_token';

  /** Reactive login state, `true` while a valid (non-expired) token is stored. */
  isLoggedIn = signal(this.checkValidToken());

  constructor (
    private http: HttpClient,
    private router: Router
  ) {
    this.checkAndEvictExpiredToken();
  }

  /**
   * Authenticates the user and stores the returned JWT.
   *
   * @param request Username and password credentials.
   * @returns Observable emitting the raw JWT; login state is updated as a side effect.
   */
  signIn (request: SignInRequest){
    return this.http.post(this.api.signIn, request, {
      responseType: 'text'
    }).pipe(
      tap((token) => {
        localStorage.setItem(this.TOKEN_KEY, token);
        this.isLoggedIn.set(true);
      })
    );
  }

  /**
   * Registers a new user and signs them in with the returned JWT.
   *
   * @param request Registration details (credentials, personal data, address).
   * @returns Observable emitting the raw JWT; login state is updated as a side effect.
   */
  signUp (request: SignUpRequest) {
    return this.http.post(this.api.signUp, request, {
      responseType: 'text'
    }).pipe(
      tap((token) => {
        localStorage.setItem(this.TOKEN_KEY, token);
        this.isLoggedIn.set(true);
      })
    );
  }

  /** Clears the stored token, resets the login state, and redirects to the sign-in page. */
  logout () {
    localStorage.removeItem(this.TOKEN_KEY);
    this.isLoggedIn.set(false);
    this.router.navigate(['/sign-in']);
  }

  /**
   * Returns the stored JWT, or `null` when absent.
   *
   * An expired token triggers {@link logout} and also yields `null`.
   *
   * @returns The valid JWT, or `null`.
   */
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

  /**
   * Extracts the current user's id from the stored JWT payload.
   *
   * Checks the `sub`, `id`, and `userId` claims in that order.
   *
   * @returns The numeric user id, or `null` when no valid token or claim exists.
   */
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

  /** Whether a non-expired token is currently stored. */
  private checkValidToken () {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      return false;
    }
    return !this.isTokenExpired(token);
  }

  /** Removes an expired token from storage on startup and resets the login state. */
  private checkAndEvictExpiredToken () {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token && this.isTokenExpired(token)) {
      localStorage.removeItem(this.TOKEN_KEY);
      this.isLoggedIn.set(false);
    }
  }

  /**
   * Checks whether the given JWT is past its `exp` claim.
   *
   * A token without an `exp` claim is treated as non-expiring; an
   * undecodable token is treated as expired.
   *
   * @param token Raw JWT to inspect.
   * @returns `true` when the token is expired or malformed.
   */
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

  /**
   * Decodes the payload segment of a JWT without verifying its signature.
   *
   * @param token Raw JWT to decode.
   * @returns The parsed payload claims, or `null` when the token is malformed.
   */
  private decodePayload (token: string): Record<string, number> | null {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }
}
