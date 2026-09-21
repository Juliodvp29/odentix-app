import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { SessionService } from './session.service';

@Component({ selector: 'app-dummy-login', template: '' })
class DummyLoginPage {}

describe('authInterceptor', () => {
  let http: HttpClient;
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
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: DummyLoginPage }]),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpTesting.verify();
    vi.unstubAllGlobals();
  });

  it('should attach the bearer token to backend requests', () => {
    session.setSession('access-123', 'refresh-123');
    http.get('/api/v1/patients').subscribe();
    const request = httpTesting.expectOne('/api/v1/patients');
    expect(request.request.headers.get('Authorization')).toBe('Bearer access-123');
    request.flush([]);
  });

  it('should send no header without a session', () => {
    http.get('/api/v1/patients').subscribe();
    const request = httpTesting.expectOne('/api/v1/patients');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush([]);
  });

  it('should never attach a token to auth endpoints', () => {
    session.setSession('access-123', 'refresh-123');
    http.post('/api/v1/auth/login', {}).subscribe();
    const request = httpTesting.expectOne('/api/v1/auth/login');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('should refresh and retry the request on 401 without logging out', () => {
    const navigate = vi.spyOn(router, 'navigateByUrl');
    session.setSession('old-access', 'refresh-123');
    let body: unknown;
    http.get('/api/v1/patients').subscribe({ next: (value) => (body = value) });
    httpTesting.expectOne('/api/v1/patients').flush({}, { status: 401, statusText: 'Unauthorized' });
    const refresh = httpTesting.expectOne((call) => call.url.includes('/api/v1/auth/refresh'));
    expect(refresh.request.body).toEqual({ refreshToken: 'refresh-123' });
    expect(refresh.request.headers.has('Authorization')).toBe(false);
    refresh.flush({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    const retry = httpTesting.expectOne('/api/v1/patients');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-access');
    retry.flush([{ id: 'p1' }]);
    expect(body).toEqual([{ id: 'p1' }]);
    expect(session.accessToken()).toBe('new-access');
    expect(session.refreshToken()).toBe('new-refresh');
    expect(session.isAuthenticated()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('should share a single refresh between concurrent 401s', () => {
    session.setSession('old-access', 'refresh-123');
    let first = 0;
    let second = 0;
    http.get('/api/v1/patients').subscribe({ next: () => (first += 1) });
    http.get('/api/v1/patients').subscribe({ next: () => (second += 1) });
    const pending = httpTesting.match('/api/v1/patients');
    expect(pending).toHaveLength(2);
    pending[0].flush({}, { status: 401, statusText: 'Unauthorized' });
    pending[1].flush({}, { status: 401, statusText: 'Unauthorized' });
    const refreshes = httpTesting.match((call) => call.url.includes('/api/v1/auth/refresh'));
    expect(refreshes).toHaveLength(1);
    refreshes[0].flush({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    const retries = httpTesting.match('/api/v1/patients');
    expect(retries).toHaveLength(2);
    retries.forEach((call) => {
      expect(call.request.headers.get('Authorization')).toBe('Bearer new-access');
      call.flush([]);
    });
    expect(first).toBe(1);
    expect(second).toBe(1);
  });

  it('should clear the session and go to login when the refresh fails', () => {
    const navigate = vi.spyOn(router, 'navigateByUrl');
    session.setSession('old-access', 'expired-refresh');
    let status = 0;
    http.get('/api/v1/patients').subscribe({ error: (error: { status?: number }) => (status = error.status ?? 0) });
    httpTesting.expectOne('/api/v1/patients').flush({}, { status: 401, statusText: 'Unauthorized' });
    httpTesting
      .expectOne((call) => call.url.includes('/api/v1/auth/refresh'))
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(session.accessToken()).toBeNull();
    expect(session.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/login');
    expect(status).toBe(401);
  });

  it('should clear the session and go to login on 401 without a refresh token', () => {
    const navigate = vi.spyOn(router, 'navigateByUrl');
    http.get('/api/v1/patients').subscribe({ error: () => {} });
    httpTesting.expectOne('/api/v1/patients').flush({}, { status: 401, statusText: 'Unauthorized' });
    httpTesting.expectNone((call) => call.url.includes('/api/v1/auth/refresh'));
    expect(session.accessToken()).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('should not refresh or redirect for 401 on auth endpoints', () => {
    const navigate = vi.spyOn(router, 'navigateByUrl');
    http.post('/api/v1/auth/login', {}).subscribe({ error: () => {} });
    httpTesting
      .expectOne('/api/v1/auth/login')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    httpTesting.expectNone((call) => call.url.includes('/api/v1/auth/refresh'));
    expect(navigate).not.toHaveBeenCalled();
  });
});
