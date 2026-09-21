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

  it('should clear the session and go to login on 401', () => {
    const navigate = vi.spyOn(router, 'navigateByUrl');
    session.setSession('access-123', 'refresh-123');
    http.get('/api/v1/patients').subscribe({ error: () => {} });
    httpTesting
      .expectOne('/api/v1/patients')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(session.accessToken()).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('should not redirect for 401 on auth endpoints', () => {
    const navigate = vi.spyOn(router, 'navigateByUrl');
    http.post('/api/v1/auth/login', {}).subscribe({ error: () => {} });
    httpTesting
      .expectOne('/api/v1/auth/login')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(navigate).not.toHaveBeenCalled();
  });
});
