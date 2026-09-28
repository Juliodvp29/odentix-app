import { HttpErrorResponse, HttpResourceRef, httpResource } from '@angular/common/http';
import { Injectable, Signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '@core/api/api-client';
import {
  OpportunityActionResponse,
  OpportunityResponse,
  RecoveredValueResponse,
} from './opportunity-models';

// The opportunities engine is a gated plan feature: a tenant without it
// gets 403 instead of data (explained in the UI, never a dead end).
export function isPlanGateError(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 403;
}

@Injectable({ providedIn: 'root' })
export class OpportunitiesService {
  private readonly api = inject(ApiClient);

  // Reactive resource for the tenant's open opportunities, already
  // ordered by priority on the backend.
  open(): HttpResourceRef<OpportunityResponse[] | undefined> {
    return httpResource<OpportunityResponse[]>(() => ({
      url: this.api.url('/api/v1/opportunities'),
    }));
  }

  // Executes a suggested action. `crear_tarea` creates the linked task,
  // `enviar_mensaje` sends through the stored channel. Re-executing or
  // missing the recipient fails with 409, surfaced for specific messages.
  executeAction(opportunityId: string, actionId: string): Observable<OpportunityActionResponse> {
    return this.api.post<Record<string, never>, OpportunityActionResponse>(
      `/api/v1/opportunities/${opportunityId}/actions/${actionId}/execute`,
      {},
    );
  }

  // Reactive resource for the recovered value per category in a range.
  // Numbers come straight from the backend endpoint: the view never
  // recomputes attribution client-side. Empty bounds skip the request.
  recoveredValue(
    from: Signal<string>,
    to: Signal<string>,
  ): HttpResourceRef<RecoveredValueResponse[] | undefined> {
    return httpResource<RecoveredValueResponse[]>(() => {
      const fromValue = from();
      const toValue = to();
      if (!fromValue || !toValue) {
        return undefined;
      }
      return {
        url: this.api.url('/api/v1/opportunities/recovered-value'),
        params: { from: fromValue, to: toValue },
      };
    });
  }
}
