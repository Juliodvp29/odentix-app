import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { ApiClient } from '@core/api/api-client';
import { components } from '@core/api/schema';
import { SessionService } from './session.service';

export type LoginRequest = components['schemas']['LoginRequest'];
type LoginResponse = components['schemas']['LoginResponse'];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiClient);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  login(credentials: LoginRequest): Observable<void> {
    return this.api.post<LoginRequest, LoginResponse>('/api/v1/auth/login', credentials).pipe(
      tap((response) => {
        if (!response.accessToken || !response.refreshToken) {
          throw new Error('Login response without tokens');
        }
        this.session.setSession(response.accessToken, response.refreshToken);
      }),
      tap(() => {
        void this.router.navigateByUrl('/');
      }),
      map(() => undefined),
    );
  }
}
