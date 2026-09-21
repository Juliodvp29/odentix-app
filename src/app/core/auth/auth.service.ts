import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { ApiClient } from '@core/api/api-client';
import { components } from '@core/api/schema';
import { SessionService } from './session.service';
import { TokenRefreshService } from './token-refresh.service';

export type LoginRequest = components['schemas']['LoginRequest'];
type LoginResponse = components['schemas']['LoginResponse'];
type LogoutRequest = components['schemas']['LogoutRequest'];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiClient);
  private readonly session = inject(SessionService);
  private readonly refresher = inject(TokenRefreshService);
  private readonly router = inject(Router);

  login(credentials: LoginRequest): Observable<void> {
    return this.api.post<LoginRequest, LoginResponse>('/api/v1/auth/login', credentials).pipe(
      tap((response) => {
        if (!response.accessToken || !response.refreshToken) {
          throw new Error('Login response without tokens');
        }
        this.session.setSession(response.accessToken, response.refreshToken, response.user ?? null);
      }),
      tap(() => {
        void this.router.navigateByUrl('/');
      }),
      map(() => undefined),
    );
  }

  refresh(): Observable<void> {
    return this.refresher.refresh();
  }

  logout(): Observable<void> {
    const refreshToken = this.session.refreshToken();
    const request = refreshToken
      ? this.api.post<LogoutRequest, void>('/api/v1/auth/logout', { refreshToken })
      : of(undefined);
    return request.pipe(
      catchError(() => of(undefined)),
      tap(() => this.session.clearSession()),
      tap(() => {
        void this.router.navigateByUrl('/login');
      }),
      map(() => undefined),
    );
  }
}
