import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SessionService } from '@core/auth/session.service';
import { waitlistGuard } from './waitlist.guard';

describe('waitlistGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'appointments', children: [] }])],
    });
  });

  it('should redirect an external specialist to appointments', () => {
    TestBed.inject(SessionService).setSession('access', 'refresh', {
      role: 'especialista_externo',
    });

    const result = TestBed.runInInjectionContext(() => waitlistGuard({} as never, {} as never));
    expect(result.toString()).toBe('/appointments');
  });

  it('should allow clinic roles', () => {
    TestBed.inject(SessionService).setSession('access', 'refresh', { role: 'recepcion' });

    const result = TestBed.runInInjectionContext(() => waitlistGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('should leave authentication to the parent auth guard', () => {
    TestBed.inject(SessionService).clearSession();

    const result = TestBed.runInInjectionContext(() => waitlistGuard({} as never, {} as never));
    expect(result).toBe(true);
  });
});
