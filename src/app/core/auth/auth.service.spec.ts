import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';

@Component({ selector: 'app-dummy-login', template: '' })
class DummyLoginPage {}

@Component({ selector: 'app-dummy-home', template: '' })
class DummyHomePage {}

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
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'login', component: DummyLoginPage },
          { path: '', component: DummyHomePage },
        ]),
      ],
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
      .flush({
        accessToken: 'access-123',
        refreshToken: 'refresh-123',
        user: { email: 'admin@odentix.co' },
      });
    expect(session.accessToken()).toBe('access-123');
    expect(session.refreshToken()).toBe('refresh-123');
    expect(session.currentUser()?.email).toBe('admin@odentix.co');
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

  it('should revoke the session server-side and clear it locally on logout', () => {
    const navigate = vi.spyOn(router, 'navigateByUrl');
    session.setSession('access-123', 'refresh-123');
    let completed = false;
    service.logout().subscribe({ next: () => (completed = true) });
    const request = httpTesting.expectOne((call) => call.url.endsWith('/api/v1/auth/logout'));
    expect(request.request.body).toEqual({ refreshToken: 'refresh-123' });
    request.flush(null);
    expect(session.accessToken()).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/login');
    expect(completed).toBe(true);
  });

  it('should still clear the session when logout fails', () => {
    session.setSession('access-123', 'refresh-123');
    let completed = false;
    service.logout().subscribe({ next: () => (completed = true) });
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/auth/logout'))
      .flush({}, { status: 500, statusText: 'Error' });
    expect(session.accessToken()).toBeNull();
    expect(completed).toBe(true);
  });

  it('should rotate tokens through the refresh endpoint', () => {
    session.setSession('old-access', 'old-refresh', { email: 'admin@odentix.co' });
    let completed = false;
    service.refresh().subscribe({ next: () => (completed = true) });
    const request = httpTesting.expectOne((call) => call.url.includes('/api/v1/auth/refresh'));
    expect(request.request.body).toEqual({ refreshToken: 'old-refresh' });
    request.flush({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    expect(completed).toBe(true);
    expect(session.accessToken()).toBe('new-access');
    expect(session.refreshToken()).toBe('new-refresh');
    expect(session.currentUser()?.email).toBe('admin@odentix.co');
  });
});
