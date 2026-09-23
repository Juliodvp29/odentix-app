import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '@core/api/api-client';
import { components } from '@core/api/schema';

export type CreateWaitlistEntryRequest = components['schemas']['CreateWaitlistEntryRequest'];
export type WaitlistEntryResponse = components['schemas']['WaitlistEntryResponse'];

@Injectable({ providedIn: 'root' })
export class WaitlistService {
  private readonly api = inject(ApiClient);

  addEntry(body: CreateWaitlistEntryRequest): Observable<WaitlistEntryResponse> {
    return this.api.post<CreateWaitlistEntryRequest, WaitlistEntryResponse>(
      '/api/v1/waitlist',
      body,
    );
  }

  getCandidates(appointmentId: string): Observable<WaitlistEntryResponse[]> {
    return this.api.get<WaitlistEntryResponse[]>(
      `/api/v1/appointments/${appointmentId}/waitlist-candidates`,
    );
  }
}
