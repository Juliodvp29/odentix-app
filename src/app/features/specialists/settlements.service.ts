import { HttpErrorResponse, HttpResourceRef, httpResource } from '@angular/common/http';
import { Injectable, Signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '@core/api/api-client';
import {
  CreateSettlementRequest,
  SettlementBreakdownResponse,
  SettlementResponse,
  SpecialistResponse,
} from './specialist-models';

// A gated tenant surfaces as 403 (explained in the UI, never a dead end).
export function isPlanGateError(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 403;
}

@Injectable({ providedIn: 'root' })
export class SettlementsService {
  private readonly api = inject(ApiClient);

  // Reactive resource for the tenant's external specialists, by name.
  specialists(): HttpResourceRef<SpecialistResponse[] | undefined> {
    return httpResource<SpecialistResponse[]>(() => ({
      url: this.api.url('/api/v1/specialists'),
    }));
  }

  // Reactive resource for a specialist's settlements, newest period first.
  settlements(specialistId: Signal<string>): HttpResourceRef<SettlementResponse[] | undefined> {
    return httpResource<SettlementResponse[]>(() => {
      const id = specialistId();
      return id ? { url: this.api.url(`/api/v1/specialists/${id}/settlements`) } : undefined;
    });
  }

  // Reactive resource for a single settlement detail.
  settlement(
    specialistId: Signal<string>,
    settlementId: Signal<string>,
  ): HttpResourceRef<SettlementResponse | undefined> {
    return httpResource<SettlementResponse>(() => {
      const specialist = specialistId();
      const settlement = settlementId();
      return specialist && settlement
        ? { url: this.api.url(`/api/v1/specialists/${specialist}/settlements/${settlement}`) }
        : undefined;
    });
  }

  // Reactive resource for the invoices behind a settlement's gross.
  breakdown(
    specialistId: Signal<string>,
    settlementId: Signal<string>,
  ): HttpResourceRef<SettlementBreakdownResponse | undefined> {
    return httpResource<SettlementBreakdownResponse>(() => {
      const specialist = specialistId();
      const settlement = settlementId();
      return specialist && settlement
        ? {
            url: this.api.url(
              `/api/v1/specialists/${specialist}/settlements/${settlement}/breakdown`,
            ),
          }
        : undefined;
    });
  }

  // Generates a settlement for a period. A duplicate period answers 409.
  generateSettlement(
    specialistId: string,
    body: CreateSettlementRequest,
  ): Observable<SettlementResponse> {
    return this.api.post<CreateSettlementRequest, SettlementResponse>(
      `/api/v1/specialists/${specialistId}/settlements`,
      body,
    );
  }
}
