import { HttpParams, HttpResourceRef, httpResource } from '@angular/common/http';
import { Injectable, Signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '@core/api/api-client';
import { components } from '@core/api/schema';
import {
  CreateTreatmentPlanRequest,
  TreatmentPlanResponse,
  TreatmentPlanStatus,
  UpdateTreatmentPlanRequest,
} from './treatment-plan-models';

export type UpdateTreatmentPlanStatusRequest =
  components['schemas']['UpdateTreatmentPlanStatusRequest'];

@Injectable({ providedIn: 'root' })
export class TreatmentPlansService {
  private readonly api = inject(ApiClient);

  // Queries all treatment plans matching optional patient and status filters.
  listTreatmentPlans(
    patientId?: string,
    status?: TreatmentPlanStatus,
  ): Observable<TreatmentPlanResponse[]> {
    let params = new HttpParams();
    if (patientId) {
      params = params.set('patientId', patientId);
    }
    if (status) {
      params = params.set('status', status);
    }
    return this.api.get<TreatmentPlanResponse[]>('/api/v1/treatment-plans', params);
  }

  // Fetches a single treatment plan by ID.
  getTreatmentPlan(id: string): Observable<TreatmentPlanResponse> {
    return this.api.get<TreatmentPlanResponse>(`/api/v1/treatment-plans/${id}`);
  }

  // Creates a new treatment plan in draft status with procedure items.
  createTreatmentPlan(body: CreateTreatmentPlanRequest): Observable<TreatmentPlanResponse> {
    return this.api.post<CreateTreatmentPlanRequest, TreatmentPlanResponse>(
      '/api/v1/treatment-plans',
      body,
    );
  }

  // Updates diagnosis, professional, or items of a plan in draft status.
  updateTreatmentPlan(
    id: string,
    body: UpdateTreatmentPlanRequest,
  ): Observable<TreatmentPlanResponse> {
    return this.api.patch<UpdateTreatmentPlanRequest, TreatmentPlanResponse>(
      `/api/v1/treatment-plans/${id}`,
      body,
    );
  }

  // Advances the plan through its lifecycle via PATCH /{id}/status.
  updateStatus(id: string, status: TreatmentPlanStatus): Observable<TreatmentPlanResponse> {
    const body: UpdateTreatmentPlanStatusRequest = { status };
    return this.api.patch<UpdateTreatmentPlanStatusRequest, TreatmentPlanResponse>(
      `/api/v1/treatment-plans/${id}/status`,
      body,
    );
  }

  // Reactive resource for a single treatment plan detail.
  detail(id: Signal<string>): HttpResourceRef<TreatmentPlanResponse | undefined> {
    return httpResource<TreatmentPlanResponse>(() => {
      const planId = id();
      return planId ? { url: this.api.url(`/api/v1/treatment-plans/${planId}`) } : undefined;
    });
  }

  // Reactive resource for listing treatment plans of a specific patient.
  patientPlans(patientId: Signal<string>): HttpResourceRef<TreatmentPlanResponse[] | undefined> {
    return httpResource<TreatmentPlanResponse[]>(() => {
      const pId = patientId();
      if (!pId) return undefined;
      return {
        url: this.api.url('/api/v1/treatment-plans'),
        params: { patientId: pId },
      };
    });
  }

  // Reactive resource for clinic-wide treatment plans with optional filters.
  clinicPlans(
    status: Signal<string>,
    patientId?: Signal<string>,
  ): HttpResourceRef<TreatmentPlanResponse[] | undefined> {
    return httpResource<TreatmentPlanResponse[]>(() => {
      const s = status();
      const p = patientId ? patientId() : '';
      const params: Record<string, string> = {};
      if (s) params['status'] = s;
      if (p) params['patientId'] = p;
      return {
        url: this.api.url('/api/v1/treatment-plans'),
        params,
      };
    });
  }
}
