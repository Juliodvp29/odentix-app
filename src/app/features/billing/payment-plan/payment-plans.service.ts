import { HttpErrorResponse, HttpResourceRef, httpResource } from '@angular/common/http';
import { Injectable, Signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '@core/api/api-client';
import {
  CreatePaymentPlanRequest,
  InstallmentResponse,
  PaymentPlanResponse,
} from './payment-plan-models';

// A missing plan surfaces as 404 (no plan yet); a gated tenant as 403.
export function isNotFoundError(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 404;
}

export function isPlanGateError(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 403;
}

@Injectable({ providedIn: 'root' })
export class PaymentPlansService {
  private readonly api = inject(ApiClient);

  // Creates an N-installment plan for a treatment plan.
  createPaymentPlan(
    treatmentPlanId: string,
    body: CreatePaymentPlanRequest,
  ): Observable<PaymentPlanResponse> {
    return this.api.post<CreatePaymentPlanRequest, PaymentPlanResponse>(
      `/api/v1/treatment-plans/${treatmentPlanId}/payment-plan`,
      body,
    );
  }

  // Reactive resource for the treatment plan's payment plan, if any.
  paymentPlan(treatmentPlanId: Signal<string>): HttpResourceRef<PaymentPlanResponse | undefined> {
    return httpResource<PaymentPlanResponse>(() => {
      const id = treatmentPlanId();
      return id ? { url: this.api.url(`/api/v1/treatment-plans/${id}/payment-plan`) } : undefined;
    });
  }

  // Marks a pending or overdue installment as paid.
  payInstallment(installmentId: string): Observable<InstallmentResponse> {
    return this.api.post<Record<string, never>, InstallmentResponse>(
      `/api/v1/installments/${installmentId}/pay`,
      {},
    );
  }
}
