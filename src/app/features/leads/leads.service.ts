import { HttpErrorResponse, HttpResourceRef, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '@core/api/api-client';
import {
  LeadResponse,
  LeadStatus,
  PageLeadResponse,
  UpdateLeadStatusRequest,
} from './lead-models';

// Single board fetch grouped client-side by stage. Large enough for a
// sales pipeline snapshot; the board says so honestly when it truncates.
export const BOARD_PAGE_SIZE = 100;

// The leads endpoints require the crm_leads plan feature: a gated
// tenant gets 403 instead of data.
export function isPlanGateError(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 403;
}

@Injectable({ providedIn: 'root' })
export class LeadsService {
  private readonly api = inject(ApiClient);

  // Reactive resource for the board page, newest activity first.
  boardPage(): HttpResourceRef<PageLeadResponse | undefined> {
    return httpResource<PageLeadResponse>(() => ({
      url: this.api.url('/api/v1/leads'),
      params: { size: String(BOARD_PAGE_SIZE), sort: 'updatedAt,desc' },
    }));
  }

  // Moves a lead to any pipeline stage, forward or backward.
  updateLeadStatus(id: string, status: LeadStatus): Observable<LeadResponse> {
    const body: UpdateLeadStatusRequest = { status };
    return this.api.patch<UpdateLeadStatusRequest, LeadResponse>(
      `/api/v1/leads/${id}/status`,
      body,
    );
  }
}
