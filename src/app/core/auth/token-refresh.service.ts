import { HttpBackend, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, finalize, map, shareReplay, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { components } from '@core/api/schema';
import { SessionService } from './session.service';

type TokenRefreshRequest = components['schemas']['TokenRefreshRequest'];
type TokenRefreshResponse = components['schemas']['TokenRefreshResponse'];

const REFRESH_PATH = '/api/v1/auth/refresh';

// Refreshes the access token using the stored refresh token.
// Uses HttpBackend directly so the call bypasses authInterceptor and can
// never trigger another refresh. Concurrent callers share one in-flight
// request and the backend rotates both tokens on every success.
@Injectable({ providedIn: 'root' })
export class TokenRefreshService {
  private readonly session = inject(SessionService);
  private readonly http: HttpClient;
  private inFlight: Observable<void> | null = null;

  constructor() {
    this.http = new HttpClient(inject(HttpBackend));
  }

  refresh(): Observable<void> {
    if (this.inFlight) {
      return this.inFlight;
    }
    const refreshToken = this.session.refreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }
    const url = buildUrl(environment.apiUrl, REFRESH_PATH);
    const body: TokenRefreshRequest = { refreshToken };
    const request = this.http.post<TokenRefreshResponse>(url, body).pipe(
      map((response) => {
        if (!response.accessToken || !response.refreshToken) {
          throw new Error('Refresh response without tokens');
        }
        this.session.updateTokens(response.accessToken, response.refreshToken);
      }),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
          this.session.clearSession();
        }
        return throwError(() => error);
      }),
      finalize(() => {
        this.inFlight = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.inFlight = request;
    return request;
  }
}

function buildUrl(apiUrl: string, path: string): string {
  const base = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  return `${base}${path}`;
}
