import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

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
}
