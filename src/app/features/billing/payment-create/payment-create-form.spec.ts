import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { InvoiceResponse } from '../billing-models';
import { PaymentCreateForm } from './payment-create-form';

const INVOICE: InvoiceResponse = {
  id: 'inv-1',
  patientId: 'patient-1',
  invoiceNumber: 'FAC-000001',
  status: 'pendiente',
  subtotalCop: 540000,
  discountCop: 20000,
  totalCop: 520000,
  items: [],
};

function setAmount(fixture: ComponentFixture<PaymentCreateForm>, value: string): void {
  const input = fixture.nativeElement.querySelector('#payment-amount') as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

function submit(fixture: ComponentFixture<PaymentCreateForm>): void {
  fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
  fixture.detectChanges();
}

describe('PaymentCreateForm', () => {
  let fixture: ComponentFixture<PaymentCreateForm>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentCreateForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(PaymentCreateForm);
    fixture.componentRef.setInput('invoice', INVOICE);
    fixture.detectChanges();
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should prefill the invoice total as the payment amount', () => {
    expect(fixture.componentInstance.model().amountCop).toBe(520000);
    const input = fixture.nativeElement.querySelector('#payment-amount') as HTMLInputElement;
    expect(input.value).toBe('520000');
  });

  it('should require a payment method before posting', () => {
    submit(fixture);
    httpTesting.expectNone((call) => call.url.includes('/payments'));
    expect(fixture.nativeElement.textContent).toContain('El medio de pago es obligatorio.');
  });

  it('should block a zero amount without posting', () => {
    fixture.componentInstance.model.update((model) => ({ ...model, method: 'efectivo' }));
    fixture.detectChanges();
    setAmount(fixture, '0');
    submit(fixture);
    httpTesting.expectNone((call) => call.url.includes('/payments'));
    expect(fixture.nativeElement.textContent).toContain('El monto debe ser mayor que cero.');
  });

  it('should POST the payment and emit it on success', async () => {
    let paidStatus: string | undefined;
    fixture.componentInstance.paid.subscribe((payment) => {
      paidStatus = payment.invoiceStatus;
    });
    fixture.componentInstance.model.update((model) => ({ ...model, method: 'transferencia' }));
    fixture.detectChanges();
    submit(fixture);
    const request = httpTesting.expectOne((call) =>
      call.url.endsWith('/api/v1/invoices/inv-1/payments'),
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ amountCop: 520000, method: 'transferencia' });
    request.flush({ id: 'pay-1', invoiceId: 'inv-1', amountCop: 520000, invoiceStatus: 'pagada' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(paidStatus).toBe('pagada');
  });

  it('should surface the backend message when the payment is rejected', async () => {
    fixture.componentInstance.model.update((model) => ({ ...model, method: 'efectivo' }));
    fixture.detectChanges();
    submit(fixture);
    const request = httpTesting.expectOne((call) => call.url.endsWith('/payments'));
    request.flush(
      { message: 'El pago de 600000 excede el saldo pendiente de 520000' },
      { status: 400, statusText: 'Bad Request' },
    );
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'El pago de 600000 excede el saldo pendiente de 520000',
    );
  });
});
