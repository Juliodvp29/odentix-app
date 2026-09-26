import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';
import { InvoiceCreateAction } from '@features/billing/invoice-create/invoice-create-action';
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

  function setup(plan: TreatmentPlanResponse | null = MOCK_PLAN, loading = false, error = false) {
    const mockDetail = {
      value: signal(plan),
      isLoading: signal(loading),
      error: signal(error ? new Error('fail') : undefined),
      reload: vi.fn(),
    };
    reload = mockDetail.reload;

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
});
