import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '@core/auth/session.service';

export const waitlistGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  if (session.currentUser()?.role === 'especialista_externo') {
    return inject(Router).createUrlTree(['/appointments']);
  }
  return true;
};

export const waitlistAccessGuard = waitlistGuard;
