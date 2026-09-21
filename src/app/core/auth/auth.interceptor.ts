import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SessionService } from './session.service';

const AUTH_PATH = '/api/v1/auth/';

function isAuthRequest(request: HttpRequest<unknown>): boolean {
  return request.url.includes(AUTH_PATH);
}

export function authInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn) {
  const session = inject(SessionService);
  const router = inject(Router);
  const token = session.accessToken();
  const outgoing =
    token && !request.headers.has('Authorization') && !isAuthRequest(request)
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;
  return next(outgoing).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !isAuthRequest(outgoing) &&
        router.url !== '/login'
      ) {
        session.clearSession();
        void router.navigateByUrl('/login');
      }
      return throwError(() => error);
    }),
  );
}
