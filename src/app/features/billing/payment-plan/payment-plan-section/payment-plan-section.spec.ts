import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { TreatmentPlanResponse } from '@features/treatment-plans/treatment-plan-models';
import { ToastService } from '@shared/toast/toast.service';
import { PaymentPlanCreateAction } from '../payment-plan-create/payment-plan-create-action';
import { PaymentPlanResponse } from '../payment-plan-models';
import { PaymentPlansService } from '../payment-plans.service';
import { PaymentPlanSection } from './payment-plan-section';

const PLAN: TreatmentPlanResponse = {
  id: 'plan-1',
  patientId: 'patient-1',
  diagnosis: 'Rehabilitación oral',
  status: 'aceptado',
  totalPriceCop: 300000,
  items: [],
};

const PAYMENT_PLAN: PaymentPlanResponse = {
  id: 'pp-1',
  treatmentPlanId: 'plan-1',
  totalAmountCop: 300000,
  installmentsCount: 3,
  installments: [
    { id: 'c-1', installmentNumber: 1, amountCop: 100000, dueDate: '2026-10-26', status: 'pagada' },
    { id: 'c-2', installmentNumber: 2, amountCop: 100000, dueDate: '2026-11-26', status: 'pendiente' },
    { id: 'c-3', installmentNumber: 3, amountCop: 100000, dueDate: '2026-12-26', status: 'vencida' },
  ],
};

describe('PaymentPlanSection', () => {
  let fixture: ComponentFixture<PaymentPlanSection>;
  let reload: ReturnType<typeof vi.fn>;
  let payInstallment: ReturnType<typeof vi.fn>;

  function setup(
    plan: PaymentPlanResponse | null = PAYMENT_PLAN,
    loading = false,
    error: unknown = undefined,
  ) {
    const mockResource = {
      value: signal(plan),
      isLoading: signal(loading),
      error: signal(error),
      reload: vi.fn(),
    };
    reload = mockResource.reload;
    payInstallment = vi.fn(() => of({ id: 'c-2', installmentNumber: 2, status: 'pagada' }));

    TestBed.configureTestingModule({
      imports: [PaymentPlanSection],
      providers: [
        {
          provide: PaymentPlansService,
          useValue: {
            paymentPlan: () => mockResource,
            payInstallment,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentPlanSection);
    fixture.componentRef.setInput('treatmentPlan', PLAN);
    fixture.detectChanges();
  }

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((element) => element.remove());
    document.documentElement.classList.remove('cdk-global-scrollblock');
  });

  it('should render the summary with collected balance and progress', () => {
    setup();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('300.000');
    expect(text).toContain('100.000');
    expect(text).toContain('200.000');
    expect(text).toContain('1 de 3 pagadas');
  });

  it('should offer payment only for pending or overdue installments', () => {
    setup();
    const buttons = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('tbody button'),
    ) as HTMLButtonElement[];
    expect(buttons).toHaveLength(2);
  });

  it('should show the creation action when no plan exists', () => {
    setup(null, false, new HttpErrorResponse({ status: 404 }));
    const action = fixture.debugElement.query(By.directive(PaymentPlanCreateAction));
    expect(action).not.toBeNull();
  });

  it('should explain cartera gating instead of failing', () => {
    setup(null, false, new HttpErrorResponse({ status: 403 }));
    expect(fixture.nativeElement.textContent).toContain('La cartera no está incluida en tu plan');
  });

  it('should render a skeleton while loading', () => {
    setup(null, true);
    expect(
      fixture.nativeElement.querySelector('[aria-label="Cargando plan de pago"]'),
    ).not.toBeNull();
  });

  it('should retry on unexpected errors', () => {
    setup(null, false, new Error('fail'));
    const retry = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((element) => element.textContent?.includes('Reintentar')) as HTMLButtonElement;
    retry.click();
    expect(reload).toHaveBeenCalled();
  });

  it('should patch the installment locally after confirming payment', async () => {
    setup();
    const toasts = TestBed.inject(ToastService);
    fixture.componentInstance.requestPay({
      id: 'c-2',
      installmentNumber: 2,
      amountCop: 100000,
      status: 'pendiente',
    });
    fixture.detectChanges();
    await fixture.componentInstance.confirmPay();
    fixture.detectChanges();
    expect(payInstallment).toHaveBeenCalledWith('c-2');
    expect(fixture.componentInstance.paidCount()).toBe(2);
    expect(toasts.toasts().map((toast) => toast.message)).toContain(
      'Cuota 2 pagada. Se generó su factura automáticamente.',
    );
    expect(reload).not.toHaveBeenCalled();
  });

  it('should reload when a plan is created or already exists', () => {
    setup(null, false, new HttpErrorResponse({ status: 404 }));
    fixture.componentInstance.onPlanChanged();
    expect(reload).toHaveBeenCalled();
  });
});
