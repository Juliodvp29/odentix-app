import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { environment } from '@environments/environment';
import { ApiClient } from './api-client';
import { components } from './schema';

type LoginRequest = components['schemas']['LoginRequest'];
type LoginResponse = components['schemas']['LoginResponse'];

describe('ApiClient', () => {
  let client: ApiClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    client = TestBed.inject(ApiClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should read the base URL from the environment', () => {
    expect(client.apiUrl).toBe(environment.apiUrl);
  });

  it('should join base URL and path with a single slash', () => {
    expect(client.url('/api/v1/auth/login')).toBe(`${environment.apiUrl}/api/v1/auth/login`);
    expect(client.url('api/v1/auth/login')).toBe(`${environment.apiUrl}/api/v1/auth/login`);
  });

  it('should type a backend call end to end against the generated schema', () => {
    const body: LoginRequest = { email: 'admin@odentix.co', password: 'secret' };
    let accessToken: string | undefined;
    client.post<LoginRequest, LoginResponse>('/api/v1/auth/login', body).subscribe((response) => {
      accessToken = response.accessToken;
    });
    const request = httpTesting.expectOne(`${environment.apiUrl}/api/v1/auth/login`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    request.flush({ accessToken: 'jwt-token' } satisfies LoginResponse);
    expect(accessToken).toBe('jwt-token');
  });
});
