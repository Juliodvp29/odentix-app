import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';
import { InvoiceResponse } from '../billing-models';
import { InvoicesService } from '../invoices.service';
import { PaymentCreateAction } from '../payment-create/payment-create-action';
import { InvoiceDetail } from './invoice-detail';

const MOCK_INVOICE: InvoiceResponse = {
  id: 'inv-1',
  patientId: 'patient-200',
  treatmentPlanId: 'plan-100',
  invoiceNumber: 'FAC-000001',
  status: 'pendiente',
  subtotalCop: 540000,
  discountCop: 20000,
  totalCop: 520000,
  issuedAt: '2026-09-26T12:00:00Z',
  items: [
    {
      id: 'i-1',
      description: 'Tratamiento pieza 16',
      quantity: 1,
      unitPriceCop: 400000,
      totalCop: 400000,
    },
    {
      id: 'i-2',
      description: 'Procedimiento del plan',
      quantity: 1,
      unitPriceCop: 140000,
      totalCop: 140000,
    },
  ],
};

describe('InvoiceDetail', () => {
  let fixture: ComponentFixture<InvoiceDetail>;
  let reload: ReturnType<typeof vi.fn>;

  function setup(invoice: InvoiceResponse | null = MOCK_INVOICE, loading = false, error = false) {
    const mockDetail = {
      value: signal(invoice),
      isLoading: signal(loading),
      error: signal(error ? new Error('fail') : undefined),
      reload: vi.fn(),
    };
    reload = mockDetail.reload;

    TestBed.configureTestingModule({
      imports: [InvoiceDetail],
      providers: [
        provideRouter([]),
        {
          provide: InvoicesService,
          useValue: {
            detail: () => mockDetail,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceDetail);
    fixture.componentRef.setInput('id', 'inv-1');
  }

  it('should render the invoice number, status, and line items', () => {
    setup();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('FAC-000001');
    expect(fixture.nativeElement.textContent).toContain('Pendiente');
    expect(fixture.nativeElement.textContent).toContain('Tratamiento pieza 16');
    expect(fixture.nativeElement.textContent).toContain('Procedimiento del plan');
  });

  it('should show a total that matches the sum of the visible lines', () => {
    setup();
    fixture.detectChanges();

    expect(fixture.componentInstance.linesSubtotal()).toBe(540000);
    expect(fixture.componentInstance.computedTotal()).toBe(MOCK_INVOICE.totalCop);
    const total = fixture.nativeElement.querySelector('[data-testid="invoice-total"]');
    expect(total.textContent).toContain('520.000');
  });

  it('should render a clear empty state when no lines exist', () => {
    setup({ ...MOCK_INVOICE, items: [] });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sin líneas registradas');
  });

  it('should render loading skeleton while resolving', () => {
    setup(null, true);
    fixture.detectChanges();

    const loading = fixture.nativeElement.querySelector('[data-testid="detail-loading"]');
    expect(loading).not.toBeNull();
    expect(loading.getAttribute('aria-busy')).toBe('true');
  });

  it('should render the payment action for the current invoice', () => {
    setup();
    fixture.detectChanges();

    const action = fixture.debugElement.query(By.directive(PaymentCreateAction));
    expect(action).not.toBeNull();
    expect(action.componentInstance.invoice().id).toBe('inv-1');
    expect(fixture.nativeElement.textContent).toContain('Registrar pago');
  });

  it('should reload the detail when a payment is registered', () => {
    setup();
    fixture.detectChanges();

    const action = fixture.debugElement.query(By.directive(PaymentCreateAction));
    action.componentInstance.paid.emit({ id: 'pay-1', invoiceStatus: 'pagada' });

    expect(reload).toHaveBeenCalled();
  });
});
