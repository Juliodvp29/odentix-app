import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it, vi } from 'vitest';
import { InvoiceCreateAction } from '@features/billing/invoice-create/invoice-create-action';
import type { InvoiceResponse } from '@features/billing/billing-models';
import { InvoicesService } from '@features/billing/invoices.service';
import { PaymentPlanSection } from '@features/billing/payment-plan/payment-plan-section/payment-plan-section';
import { PaymentPlansService } from '@features/billing/payment-plan/payment-plans.service';
import { TreatmentPlansService } from '../treatment-plans.service';
import { TreatmentPlanResponse } from '../treatment-plan-models';
import { TreatmentPlanStatusActions } from '../treatment-plan-status-actions/treatment-plan-status-actions';
import { TreatmentPlanDetail } from './treatment-plan-detail';

const MOCK_PLAN: TreatmentPlanResponse = {
  id: 'plan-100',
  patientId: 'patient-200',
  patientFullName: 'Carlos Pérez',
  professionalFullName: 'Dr. Mario Bros',
  diagnosis: 'Rehabilitación oral total',
  status: 'borrador',
  totalPriceCop: 650000,
  createdAt: '2026-09-24T12:00:00Z',
  items: [
    {
      id: 'item-1',
      toothNumber: 16,
      priceCop: 700000,
      discountCop: 50000,
      netPriceCop: 650000,
    },
  ],
};

describe('TreatmentPlanDetail', () => {
  let fixture: ComponentFixture<TreatmentPlanDetail>;
  let reload: ReturnType<typeof vi.fn>;

  function setup(
    plan: TreatmentPlanResponse | null = MOCK_PLAN,
    loading = false,
    error = false,
    invoices: InvoiceResponse[] = [],
    invoicesLoading = false,
  ) {
    const mockDetail = {
      value: signal(plan),
      isLoading: signal(loading),
      error: signal(error ? new Error('fail') : undefined),
      reload: vi.fn(),
    };
    reload = mockDetail.reload;
    const mockInvoicesPage = {
      value: signal({ content: invoices }),
      isLoading: signal(invoicesLoading),
      error: signal(undefined),
      reload: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [TreatmentPlanDetail],
      providers: [
        provideRouter([]),
        {
          provide: TreatmentPlansService,
          useValue: {
            detail: () => mockDetail,
          },
        },
        {
          provide: InvoicesService,
          useValue: {
            patientInvoices: () => mockInvoicesPage,
          },
        },
        {
          provide: PaymentPlansService,
          useValue: {
            paymentPlan: () => ({
              value: signal(null),
              isLoading: signal(false),
              error: signal(new HttpErrorResponse({ status: 404 })),
              reload: vi.fn(),
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TreatmentPlanDetail);
    fixture.componentRef.setInput('id', 'plan-100');
  }

  it('should render the plan details and procedure items', () => {
    setup();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Rehabilitación oral total');
    expect(fixture.nativeElement.textContent).toContain('Carlos Pérez');
    expect(fixture.nativeElement.textContent).toContain('Dr. Mario Bros');
    expect(fixture.nativeElement.textContent).toContain('Pieza 16');
    expect(fixture.nativeElement.textContent).toContain('650.000');
  });

  it('should render a clear empty state when no procedures exist', () => {
    setup({ ...MOCK_PLAN, items: [] });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sin procedimientos registrados');
  });

  it('should render loading skeleton while resolving', () => {
    setup(null, true);
    fixture.detectChanges();

    const loading = fixture.nativeElement.querySelector('[data-testid="detail-loading"]');
    expect(loading).not.toBeNull();
    expect(loading.getAttribute('aria-busy')).toBe('true');
  });

  it('should render the status actions for the current plan', () => {
    setup();
    fixture.detectChanges();

    const actions = fixture.debugElement.query(By.directive(TreatmentPlanStatusActions));
    expect(actions).not.toBeNull();
    expect(actions.componentInstance.plan().status).toBe('borrador');
    expect(fixture.nativeElement.textContent).toContain('CAMBIAR ESTADO');
  });

  it('should reload the detail when the status actions emit an update', () => {
    setup();
    fixture.detectChanges();

    const actions = fixture.debugElement.query(By.directive(TreatmentPlanStatusActions));
    actions.componentInstance.planUpdated.emit({ ...MOCK_PLAN, status: 'presentado' });

    expect(reload).toHaveBeenCalled();
  });

  it('should render the invoice action for the current plan', () => {
    setup();
    fixture.detectChanges();

    const action = fixture.debugElement.query(By.directive(InvoiceCreateAction));
    expect(action).not.toBeNull();
    expect(action.componentInstance.plan().id).toBe('plan-100');
    expect(fixture.nativeElement.textContent).toContain('Generar factura');
  });

  it('should navigate to the invoice detail when an invoice is created', () => {
    setup();
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const action = fixture.debugElement.query(By.directive(InvoiceCreateAction));
    action.componentInstance.created.emit({ id: 'inv-1', invoiceNumber: 'FAC-000001' });

    expect(navigate).toHaveBeenCalledWith(['/billing', 'inv-1']);
  });

  it('should list the existing invoice instead of the create action when already invoiced', () => {
    setup(MOCK_PLAN, false, false, [
      {
        id: 'inv-1',
        treatmentPlanId: 'plan-100',
        invoiceNumber: 'FAC-000001',
        status: 'pagada',
      },
    ]);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.directive(InvoiceCreateAction))).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('FAC-000001');
    expect(fixture.nativeElement.textContent).toContain('Pagada');
    const link = fixture.nativeElement.querySelector(
      'a[href="/billing/inv-1"]',
    ) as HTMLAnchorElement;
    expect(link).not.toBeNull();
  });

  it('should ignore other patients invoices when checking for duplicates', () => {
    setup(MOCK_PLAN, false, false, [
      { id: 'inv-9', treatmentPlanId: 'plan-999', invoiceNumber: 'FAC-000009', status: 'pagada' },
    ]);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.directive(InvoiceCreateAction))).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('FAC-000009');
  });

  it('should render the payment plan section for the current plan', () => {
    setup();
    fixture.detectChanges();

    const section = fixture.debugElement.query(By.directive(PaymentPlanSection));
    expect(section).not.toBeNull();
    expect(section.componentInstance.treatmentPlan().id).toBe('plan-100');
    expect(fixture.nativeElement.textContent).toContain('Plan de pago');
    expect(fixture.nativeElement.textContent).toContain('Crear plan de pago');
  });
});
