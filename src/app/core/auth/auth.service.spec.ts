import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;
  let session: SessionService;
  let router: Router;

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    });
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpTesting.verify();
    vi.unstubAllGlobals();
  });

  it('should store the session and navigate on successful login', () => {
    const navigate = vi.spyOn(router, 'navigateByUrl');
    let completed = false;
    service.login({ email: 'admin@odentix.co', password: 'secret' }).subscribe({
      next: () => (completed = true),
    });
    httpTesting
      .expectOne((request) => request.url.endsWith('/api/v1/auth/login'))
      .flush({ accessToken: 'access-123', refreshToken: 'refresh-123' });
    expect(session.accessToken()).toBe('access-123');
    expect(session.refreshToken()).toBe('refresh-123');
    expect(navigate).toHaveBeenCalledWith('/');
    expect(completed).toBe(true);
  });

  it('should fail without storing a session when tokens are missing', () => {
    const navigate = vi.spyOn(router, 'navigateByUrl');
    let failed = false;
    service.login({ email: 'admin@odentix.co', password: 'secret' }).subscribe({
      error: () => (failed = true),
    });
    httpTesting.expectOne((request) => request.url.endsWith('/api/v1/auth/login')).flush({});
    expect(failed).toBe(true);
    expect(session.accessToken()).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('should propagate a 401 without storing a session', () => {
    let status = 0;
    service.login({ email: 'admin@odentix.co', password: 'wrong' }).subscribe({
      error: (error: { status?: number }) => (status = error.status ?? 0),
    });
    httpTesting
      .expectOne((request) => request.url.endsWith('/api/v1/auth/login'))
      .flush({ error: 'Credenciales inválidas' }, { status: 401, statusText: 'Unauthorized' });
    expect(status).toBe(401);
    expect(session.accessToken()).toBeNull();
  });
});
