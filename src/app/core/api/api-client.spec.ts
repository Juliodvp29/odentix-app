import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpEventType, provideHttpClient } from '@angular/common/http';
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

  it('should send a typed PATCH request', () => {
    let echoed: unknown;
    client
      .patch<{ firstName: string }, { firstName?: string }>('/api/v1/patients/1', {
        firstName: 'Ada',
      })
      .subscribe((response) => (echoed = response.firstName));
    const request = httpTesting.expectOne(`${environment.apiUrl}/api/v1/patients/1`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ firstName: 'Ada' });
    request.flush({ firstName: 'Ada' });
    expect(echoed).toBe('Ada');
  });

  it('should upload multipart data reporting progress events', () => {
    const formData = new FormData();
    formData.append('file', new Blob(['data']), 'scan.pdf');
    const eventTypes: string[] = [];
    let uploadedName: string | undefined;
    client
      .upload<{ fileName?: string }>('/api/v1/patients/1/files', formData)
      .subscribe((event) => {
        if (event.type === HttpEventType.UploadProgress) {
          eventTypes.push('progress');
        }
        if (event.type === HttpEventType.Response) {
          eventTypes.push('response');
          uploadedName = event.body?.fileName;
        }
      });
    const request = httpTesting.expectOne(`${environment.apiUrl}/api/v1/patients/1/files`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBe(formData);
    expect(request.request.reportProgress).toBe(true);
    request.event({ type: HttpEventType.UploadProgress, loaded: 50, total: 100 });
    request.flush({ fileName: 'scan.pdf' });
    expect(eventTypes).toEqual(['progress', 'response']);
    expect(uploadedName).toBe('scan.pdf');
  });

  it('should send a typed GET request', () => {
    let fileName: string | undefined;
    client
      .get<{ fileName?: string }>('/api/v1/patients/1/files/file-1/download-url')
      .subscribe((response) => (fileName = response.fileName));
    const request = httpTesting.expectOne(
      `${environment.apiUrl}/api/v1/patients/1/files/file-1/download-url`,
    );
    expect(request.request.method).toBe('GET');
    request.flush({ fileName: 'scan.pdf' });
    expect(fileName).toBe('scan.pdf');
  });
});
