import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { SessionService } from './session.service';
import { TokenRefreshService } from './token-refresh.service';

const AUTH_PATH = '/api/v1/auth/';

function isAuthRequest(request: HttpRequest<unknown>): boolean {
  return request.url.includes(AUTH_PATH);
}

function isUnauthorized(error: unknown): error is HttpErrorResponse {
  return error instanceof HttpErrorResponse && error.status === 401;
}

export function authInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn) {
  const session = inject(SessionService);
  const router = inject(Router);
  const refresher = inject(TokenRefreshService);
  const token = session.accessToken();
  const outgoing =
    token && !request.headers.has('Authorization') && !isAuthRequest(request)
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;
  return next(outgoing).pipe(
    catchError((error: unknown) => {
      if (!isUnauthorized(error) || isAuthRequest(outgoing)) {
        return throwError(() => error);
      }
      if (!session.refreshToken()) {
        session.clearSession();
        if (router.url !== '/login') {
          void router.navigateByUrl('/login');
        }
        return throwError(() => error);
      }
      return refresher.refresh().pipe(
        switchMap(() => {
          const retryToken = session.accessToken();
          const retry =
            retryToken && !request.headers.has('Authorization')
              ? request.clone({ setHeaders: { Authorization: `Bearer ${retryToken}` } })
              : request;
          return next(retry);
        }),
        catchError((refreshError: unknown) => {
          if (!session.isAuthenticated() && router.url !== '/login') {
            void router.navigateByUrl('/login');
          }
          return throwError(() => refreshError);
        }),
      );
    }),
  );
}
