import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SessionService } from './session.service';
import { TokenRefreshService } from './token-refresh.service';

describe('TokenRefreshService', () => {
  let service: TokenRefreshService;
  let httpTesting: HttpTestingController;
  let session: SessionService;

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    });
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TokenRefreshService);
    httpTesting = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionService);
  });

  afterEach(() => {
    httpTesting.verify();
    vi.unstubAllGlobals();
  });

  it('should rotate both tokens while keeping the current user', () => {
    session.setSession('old-access', 'old-refresh', { email: 'admin@odentix.co' });
    let completed = false;
    service.refresh().subscribe({ next: () => (completed = true) });
    const request = httpTesting.expectOne((call) => call.url.includes('/api/v1/auth/refresh'));
    expect(request.request.body).toEqual({ refreshToken: 'old-refresh' });
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    expect(completed).toBe(true);
    expect(session.accessToken()).toBe('new-access');
    expect(session.refreshToken()).toBe('new-refresh');
    expect(session.currentUser()?.email).toBe('admin@odentix.co');
    expect(session.isAuthenticated()).toBe(true);
  });

  it('should share one request between concurrent refreshes', () => {
    session.setSession('old-access', 'old-refresh');
    let first = 0;
    let second = 0;
    service.refresh().subscribe({ next: () => (first += 1) });
    service.refresh().subscribe({ next: () => (second += 1) });
    const requests = httpTesting.match((call) => call.url.includes('/api/v1/auth/refresh'));
    expect(requests).toHaveLength(1);
    requests[0].flush({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    expect(first).toBe(1);
    expect(second).toBe(1);
  });

  it('should fail without calling the backend when tokens are missing', () => {
    let failed = false;
    service.refresh().subscribe({ error: () => (failed = true) });
    httpTesting.expectNone((call) => call.url.includes('/api/v1/auth/refresh'));
    expect(failed).toBe(true);
  });

  it('should fail without storing a session when the response has no tokens', () => {
    session.setSession('old-access', 'old-refresh');
    let failed = false;
    service.refresh().subscribe({ error: () => (failed = true) });
    httpTesting.expectOne((call) => call.url.includes('/api/v1/auth/refresh')).flush({});
    expect(failed).toBe(true);
    expect(session.accessToken()).toBe('old-access');
  });

  it('should clear the session when the backend rejects the refresh token', () => {
    session.setSession('old-access', 'expired-refresh');
    let status = 0;
    service
      .refresh()
      .subscribe({ error: (error: { status?: number }) => (status = error.status ?? 0) });
    httpTesting
      .expectOne((call) => call.url.includes('/api/v1/auth/refresh'))
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(status).toBe(401);
    expect(session.accessToken()).toBeNull();
    expect(session.isAuthenticated()).toBe(false);
  });

  it('should keep the session on a transient refresh failure', () => {
    session.setSession('old-access', 'old-refresh');
    let failed = false;
    service.refresh().subscribe({ error: () => (failed = true) });
    httpTesting
      .expectOne((call) => call.url.includes('/api/v1/auth/refresh'))
      .flush({}, { status: 500, statusText: 'Error' });
    expect(failed).toBe(true);
    expect(session.accessToken()).toBe('old-access');
    expect(session.isAuthenticated()).toBe(true);
  });
});
