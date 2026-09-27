import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ApiClient } from '@core/api/api-client';
import { InstallmentResponse, PaymentPlanResponse } from './payment-plan-models';
import { PaymentPlansService, isNotFoundError, isPlanGateError } from './payment-plans.service';

const MOCK_PLAN: PaymentPlanResponse = {
  id: 'pp-1',
  treatmentPlanId: 'plan-123',
  totalAmountCop: 300000,
  installmentsCount: 3,
  installments: [
    { id: 'c-1', installmentNumber: 1, amountCop: 100000, status: 'pendiente' },
    { id: 'c-2', installmentNumber: 2, amountCop: 100000, status: 'pendiente' },
    { id: 'c-3', installmentNumber: 3, amountCop: 100000, status: 'pendiente' },
  ],
};

describe('PaymentPlansService', () => {
  let service: PaymentPlansService;
  let api: ApiClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PaymentPlansService,
        {
          provide: ApiClient,
          useValue: {
            url: (path: string) => `http://localhost:8081${path}`,
            get: vi.fn(),
            post: vi.fn(),
          },
        },
      ],
    });
    service = TestBed.inject(PaymentPlansService);
    api = TestBed.inject(ApiClient);
  });

  it('should post a payment plan for a treatment plan', async () => {
    vi.spyOn(api, 'post').mockReturnValue(of(MOCK_PLAN));

    let result: PaymentPlanResponse | undefined;
    service
      .createPaymentPlan('plan-123', { totalAmountCop: 300000, installmentsCount: 3 })
      .subscribe((res) => {
        result = res;
      });

    expect(api.post).toHaveBeenCalledWith('/api/v1/treatment-plans/plan-123/payment-plan', {
      totalAmountCop: 300000,
      installmentsCount: 3,
    });
    expect(result).toEqual(MOCK_PLAN);
  });

  it('should post an installment payment', async () => {
    const paid: InstallmentResponse = { id: 'c-1', installmentNumber: 1, status: 'pagada' };
    vi.spyOn(api, 'post').mockReturnValue(of(paid));

    let result: InstallmentResponse | undefined;
    service.payInstallment('c-1').subscribe((res) => {
      result = res;
    });

    expect(api.post).toHaveBeenCalledWith('/api/v1/installments/c-1/pay', {});
    expect(result?.status).toBe('pagada');
  });
});

describe('payment plan errors', () => {
  it('should distinguish a missing plan from a gated tenant', () => {
    expect(isNotFoundError(new HttpErrorResponse({ status: 404 }))).toBe(true);
    expect(isNotFoundError(new HttpErrorResponse({ status: 403 }))).toBe(false);
    expect(isPlanGateError(new HttpErrorResponse({ status: 403 }))).toBe(true);
    expect(isPlanGateError(new HttpErrorResponse({ status: 500 }))).toBe(false);
  });
});
