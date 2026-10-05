import { httpResource } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { ApiClient } from '@core/api/api-client';
import { PlanSummaryResponse, planHasFeature, planLimit } from './plan-models';

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
}
