import { HttpErrorResponse, HttpResourceRef, httpResource } from '@angular/common/http';
import { Injectable, Signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '@core/api/api-client';
import {
  ConvertLeadPatientData,
  ConvertLeadResponse,
  CreateLeadActivityRequest,
  LeadActivityResponse,
  LeadConversionMetricsResponse,
  LeadResponse,
  LeadResponseTimeMetricsResponse,
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

  // Reactive resource for a single lead detail.
  leadDetail(id: Signal<string>): HttpResourceRef<LeadResponse | undefined> {
    return httpResource<LeadResponse>(() => {
      const leadId = id();
      return leadId ? { url: this.api.url(`/api/v1/leads/${leadId}`) } : undefined;
    });
  }

  // Reactive resource for the contact history, newest first.
  activities(id: Signal<string>): HttpResourceRef<LeadActivityResponse[] | undefined> {
    return httpResource<LeadActivityResponse[]>(() => {
      const leadId = id();
      return leadId ? { url: this.api.url(`/api/v1/leads/${leadId}/activities`) } : undefined;
    });
  }

  // Logs a contact attempt against a lead.
  addActivity(
    id: string,
    body: CreateLeadActivityRequest,
  ): Observable<LeadActivityResponse> {
    return this.api.post<CreateLeadActivityRequest, LeadActivityResponse>(
      `/api/v1/leads/${id}/activities`,
      body,
    );
  }

  // Converts a lead into a patient. The response carries the resulting
  // patient id and whether it already existed (idempotent backend).
  convertLead(
    id: string,
    patient?: ConvertLeadPatientData,
  ): Observable<ConvertLeadResponse> {
    const body = patient ? { patient } : {};
    return this.api.post<{ patient?: ConvertLeadPatientData }, ConvertLeadResponse>(
      `/api/v1/leads/${id}/convert`,
      body,
    );
  }

  // Reactive resource for conversion metrics in a date range.
  conversionMetrics(
    from: Signal<string>,
    to: Signal<string>,
  ): HttpResourceRef<LeadConversionMetricsResponse | undefined> {
    return httpResource<LeadConversionMetricsResponse>(() => ({
      url: this.api.url('/api/v1/leads/metrics/conversion'),
      params: { from: from(), to: to() },
    }));
  }

  // Reactive resource for response-time metrics in a date range.
  responseTimeMetrics(
    from: Signal<string>,
    to: Signal<string>,
  ): HttpResourceRef<LeadResponseTimeMetricsResponse | undefined> {
    return httpResource<LeadResponseTimeMetricsResponse>(() => ({
      url: this.api.url('/api/v1/leads/metrics/response-time'),
      params: { from: from(), to: to() },
    }));
  }
}
