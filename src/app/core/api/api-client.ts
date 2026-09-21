import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

// Base URL is the backend host without path prefix. Paths passed here must
// be full OpenAPI paths (e.g. `/api/v1/auth/login`), verbatim from schema.ts.
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);

  readonly apiUrl = environment.apiUrl;

  url(path: string): string {
    const base = this.apiUrl.endsWith('/') ? this.apiUrl.slice(0, -1) : this.apiUrl;
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  }

  post<RequestBody, ResponseBody>(path: string, body: RequestBody): Observable<ResponseBody> {
    return this.http.post<ResponseBody>(this.url(path), body);
  }

  get<ResponseBody>(path: string): Observable<ResponseBody> {
    return this.http.get<ResponseBody>(this.url(path));
  }

  patch<RequestBody, ResponseBody>(path: string, body: RequestBody): Observable<ResponseBody> {
    return this.http.patch<ResponseBody>(this.url(path), body);
  }

  upload<ResponseBody>(path: string, formData: FormData): Observable<HttpEvent<ResponseBody>> {
    const request = new HttpRequest('POST', this.url(path), formData, { reportProgress: true });
    return this.http.request<ResponseBody>(request);
  }
}
