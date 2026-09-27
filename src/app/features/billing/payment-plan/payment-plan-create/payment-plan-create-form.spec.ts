import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import type { TreatmentPlanResponse } from '@features/treatment-plans/treatment-plan-models';
import { PaymentPlanResponse } from '../payment-plan-models';
import { PaymentPlanCreateForm } from './payment-plan-create-form';

const PLAN: TreatmentPlanResponse = {
  id: 'plan-1',
  patientId: 'patient-1',
  diagnosis: 'Rehabilitación oral',
  status: 'aceptado',
  totalPriceCop: 300000,
  items: [],
};

function setCount(fixture: ComponentFixture<PaymentPlanCreateForm>, value: string): void {
  const input = fixture.nativeElement.querySelector('#payment-plan-count') as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

describe('PaymentPlanCreateForm', () => {
  let fixture: ComponentFixture<PaymentPlanCreateForm>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentPlanCreateForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(PaymentPlanCreateForm);
    fixture.componentRef.setInput('treatmentPlan', PLAN);
    fixture.detectChanges();
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should prefill the plan total and preview the split', () => {
    expect(fixture.componentInstance.model().totalAmountCop).toBe(300000);
    expect(fixture.componentInstance.preview()).toEqual([100000, 100000, 100000]);
    expect(fixture.nativeElement.textContent).toContain('Cuota 3');
  });

  it('should POST the plan and emit it on success', async () => {
    let createdId: string | undefined;
    fixture.componentInstance.created.subscribe((plan) => {
      createdId = plan.id;
    });
    const button = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((element) => element.textContent?.includes('Crear plan de pago')) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    const request = httpTesting.expectOne((call) =>
      call.url.endsWith('/api/v1/treatment-plans/plan-1/payment-plan'),
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ totalAmountCop: 300000, installmentsCount: 3 });
    const response: PaymentPlanResponse = {
      id: 'pp-1',
      treatmentPlanId: 'plan-1',
      totalAmountCop: 300000,
      installmentsCount: 3,
    };
    request.flush(response);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(createdId).toBe('pp-1');
  });

  it('should block a count above 60 without posting', () => {
    setCount(fixture, '61');
    const button = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((element) => element.textContent?.includes('Crear plan de pago')) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    httpTesting.expectNone((call) => call.url.includes('/payment-plan'));
    expect(fixture.nativeElement.textContent).toContain(
      'El número de cuotas no puede exceder 60.',
    );
  });

  it('should emit alreadyExists when the backend reports a conflict', async () => {
    let conflicted = false;
    fixture.componentInstance.alreadyExists.subscribe(() => {
      conflicted = true;
    });
    const button = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((element) => element.textContent?.includes('Crear plan de pago')) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    const request = httpTesting.expectOne((call) => call.url.endsWith('/payment-plan'));
    request.flush({ message: 'Ya existe' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(conflicted).toBe(true);
  });
});
