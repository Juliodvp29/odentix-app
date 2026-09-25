import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { TreatmentPlanResponse } from '../treatment-plan-models';
import { TreatmentPlansList } from './treatment-plans-list';

const MOCK_PLANS: TreatmentPlanResponse[] = [
  {
    id: 'plan-1',
    patientId: 'patient-1',
    patientFullName: 'Carlos Pérez',
    professionalFullName: 'Dr. Mario Bros',
    diagnosis: 'Rehabilitación estética',
    status: 'borrador',
    totalPriceCop: 380000,
    createdAt: '2026-09-24T12:00:00Z',
    items: [],
  },
];

describe('TreatmentPlansList', () => {
  let fixture: ComponentFixture<TreatmentPlansList>;
  let component: TreatmentPlansList;
  let httpTesting: HttpTestingController;

  async function flushPlans(plans: TreatmentPlanResponse[] = MOCK_PLANS): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    const req = httpTesting.expectOne((call) => call.url.includes('/api/v1/treatment-plans'));
    req.flush(plans);
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreatmentPlansList],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TreatmentPlansList);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should expose a busy loading state while plans resolve', () => {
    fixture.detectChanges();

    const loading = fixture.nativeElement.querySelector('[data-testid="plans-loading"]');
    expect(loading).not.toBeNull();
    expect(loading.getAttribute('aria-busy')).toBe('true');

    httpTesting.expectOne((call) => call.url.includes('/api/v1/treatment-plans')).flush([]);
  });

  it('should render the list of plans with status, diagnosis, and price', async () => {
    fixture.detectChanges();
    await flushPlans();

    expect(fixture.nativeElement.textContent).toContain('Rehabilitación estética');
    expect(fixture.nativeElement.textContent).toContain('Carlos Pérez');
    expect(fixture.nativeElement.textContent).toContain('Borrador');
    expect(fixture.nativeElement.textContent).toContain('380.000');
  });

  it('should show empty state when no plans exist', async () => {
    fixture.detectChanges();
    await flushPlans([]);

    const empty = fixture.nativeElement.querySelector('[data-testid="plans-empty"]');
    expect(empty).not.toBeNull();
    expect(empty.textContent).toContain('No hay planes de tratamiento');
  });

  it('should emit newPlanClicked when creating a plan for a patient', async () => {
    fixture.componentRef.setInput('patientId', 'patient-1');
    fixture.detectChanges();
    await flushPlans();

    const emitSpy = vi.spyOn(component.newPlanClicked, 'emit');
    const button = fixture.nativeElement.querySelector('button');
    button?.click();

    expect(emitSpy).toHaveBeenCalled();
  });
});
