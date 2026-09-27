import { HttpErrorResponse, HttpResourceRef, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClient } from '@core/api/api-client';
import { PortfolioSummaryResponse } from './portfolio-models';

// A gated tenant surfaces as 403 (explained in the UI, never a dead end).
export function isPlanGateError(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 403;
}

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private readonly api = inject(ApiClient);

  // Reactive resource for the clinic's consolidated portfolio summary.
  // The component is created per route entry, so every visit fetches
  // fresh numbers without a manual refresh.
  summary(): HttpResourceRef<PortfolioSummaryResponse | undefined> {
    return httpResource<PortfolioSummaryResponse>(() => ({
      url: this.api.url('/api/v1/portfolio/summary'),
    }));
  }
}
