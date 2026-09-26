import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import type { TreatmentPlanResponse } from '@features/treatment-plans/treatment-plan-models';
import { InvoiceCreateForm } from './invoice-create-form';

const PLAN: TreatmentPlanResponse = {
  id: 'plan-1',
  patientId: 'patient-1',
  diagnosis: 'Rehabilitación oral',
  status: 'aceptado',
  totalPriceCop: 520000,
  items: [
    { id: 'item-1', toothNumber: 16, priceCop: 400000, discountCop: 20000, netPriceCop: 380000 },
    { id: 'item-2', toothNumber: undefined, priceCop: 140000, discountCop: 0, netPriceCop: 140000 },
  ],
};

function setDiscount(fixture: ComponentFixture<InvoiceCreateForm>, value: string): void {
  const input = fixture.nativeElement.querySelector('#invoice-discount') as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

function submit(fixture: ComponentFixture<InvoiceCreateForm>): void {
  fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
  fixture.detectChanges();
}

describe('InvoiceCreateForm', () => {
  let fixture: ComponentFixture<InvoiceCreateForm>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceCreateForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(InvoiceCreateForm);
    fixture.componentRef.setInput('plan', PLAN);
    fixture.detectChanges();
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should preview the inferred lines with the plan subtotal', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Tratamiento pieza 16');
    expect(text).toContain('Procedimiento del plan');
    expect(text).toContain('540.000');
    expect(fixture.componentInstance.subtotal()).toBe(540000);
  });

  it('should prefill the plan discount and show the live total', () => {
    expect(fixture.componentInstance.model().discountCop).toBe(20000);
    expect(fixture.componentInstance.liveTotal()).toBe(520000);
    expect(fixture.nativeElement.textContent).toContain('520.000');
  });

  it('should update the live total when the discount changes', () => {
    setDiscount(fixture, '40000');
    expect(fixture.componentInstance.liveTotal()).toBe(500000);
  });

  it('should POST the invoice and emit it on success', async () => {
    let createdId: string | undefined;
    fixture.componentInstance.created.subscribe((invoice) => {
      createdId = invoice.id;
    });
    submit(fixture);
    const request = httpTesting.expectOne((call) => call.url.endsWith('/api/v1/invoices'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ treatmentPlanId: 'plan-1', discountCop: 20000 });
    request.flush({ id: 'inv-9', invoiceNumber: 'FAC-000009', status: 'pendiente', totalCop: 520000 });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(createdId).toBe('inv-9');
  });

  it('should block a discount above the subtotal without posting', () => {
    setDiscount(fixture, '600000');
    submit(fixture);
    httpTesting.expectNone((call) => call.url.includes('/api/v1/invoices'));
    expect(fixture.nativeElement.textContent).toContain(
      'El descuento no puede superar el subtotal.',
    );
  });

  it('should surface the backend message when creation fails', async () => {
    submit(fixture);
    const request = httpTesting.expectOne((call) => call.url.endsWith('/api/v1/invoices'));
    request.flush(
      { message: 'El plan no tiene ítems para facturar' },
      { status: 400, statusText: 'Bad Request' },
    );
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('El plan no tiene ítems para facturar');
  });
});
