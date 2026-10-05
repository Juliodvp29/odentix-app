import { HttpResourceRef, httpResource } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '@core/api/api-client';
import {
  BillingCycle,
  CheckoutRequest,
  CheckoutResponse,
  PlanCatalogResponse,
  PlanSummaryResponse,
  planHasFeature,
  planLimit,
} from './plan-models';

// Singleton (provided in root): the resource is created once, so the
// plan is fetched once and cached as a signal for the whole session.
@Injectable({ providedIn: 'root' })
export class PlanService {
  private readonly api = inject(ApiClient);
  private readonly resource = httpResource<PlanSummaryResponse>(() => ({
    url: this.api.url('/api/v1/billing/plan'),
  }));

  readonly plan = this.resource.value;
  readonly ready = computed(
    () => this.resource.value() !== undefined || this.resource.error() !== undefined,
  );

  hasFeature(feature: string): boolean {
    return planHasFeature(this.resource.value(), this.resource.error() !== undefined, feature);
  }

  limit(limitKey: string): number | null {
    return planLimit(this.resource.value(), limitKey);
  }

  // Reactive resource for the plans catalog: prices, features and
  // limits, straight from the backend so the UI never hardcodes them.
  catalog(): HttpResourceRef<PlanCatalogResponse[] | undefined> {
    return httpResource<PlanCatalogResponse[]>(() => ({
      url: this.api.url('/api/v1/billing/plans'),
    }));
  }

  // Starts a Bold checkout for a plan change. Owner-only server-side;
  // the response carries the payment URL to redirect to.
  checkout(planCode: string, billingCycle: BillingCycle): Observable<CheckoutResponse> {
    const body: CheckoutRequest = { planCode, billingCycle };
    return this.api.post<CheckoutRequest, CheckoutResponse>('/api/v1/billing/checkout', body);
  }
}
