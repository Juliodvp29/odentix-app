import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { ToastService } from '@shared/toast/toast.service';
import type { TreatmentPlanResponse } from '../treatment-plan-models';
import { TreatmentPlanStatusActions } from './treatment-plan-status-actions';

function plan(status: string): TreatmentPlanResponse {
  return {
    id: 'plan-1',
    patientId: 'patient-1',
    diagnosis: 'Rehabilitación oral',
    status: status as TreatmentPlanResponse['status'],
  };
}

function clickButton(fixture: ComponentFixture<TreatmentPlanStatusActions>, label: string): void {
  const buttons = Array.from(
    fixture.nativeElement.querySelectorAll('button'),
  ) as HTMLButtonElement[];
  const target = buttons.find((button) => button.textContent?.includes(label));
  expect(target).toBeTruthy();
  target?.click();
  fixture.detectChanges();
}

function paneText(): string {
  return document.querySelector('.cdk-overlay-pane')?.textContent ?? '';
}

function clickInPane(label: string): void {
  const buttons = Array.from(
    document.querySelectorAll('.cdk-overlay-pane button'),
  ) as HTMLButtonElement[];
  const target = buttons.find((button) => button.textContent?.includes(label));
  expect(target).toBeTruthy();
  target?.click();
}

describe('TreatmentPlanStatusActions', () => {
  let fixture: ComponentFixture<TreatmentPlanStatusActions>;
  let httpTesting: HttpTestingController;
  let toasts: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreatmentPlanStatusActions],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(TreatmentPlanStatusActions);
    httpTesting = TestBed.inject(HttpTestingController);
    toasts = TestBed.inject(ToastService);
  });

  afterEach(() => {
    httpTesting.verify();
    document.querySelectorAll('.cdk-overlay-container').forEach((element) => element.remove());
    document.documentElement.classList.remove('cdk-global-scrollblock');
  });

  it('should render only the valid transitions for a borrador plan', () => {
    fixture.componentRef.setInput('plan', plan('borrador'));
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Presentar plan');
    expect(text).toContain('Abandonar');
    expect(text).not.toContain('Aceptar plan');
    expect(text).not.toContain('Marcar completado');
  });

  it('should render all five actions for a presentado plan', () => {
    fixture.componentRef.setInput('plan', plan('presentado'));
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Poner en decisión');
    expect(text).toContain('Aceptar plan');
    expect(text).toContain('Rechazar');
    expect(text).toContain('Posponer');
    expect(text).toContain('Abandonar');
    expect(text).not.toContain('Presentar plan');
    expect(text).not.toContain('Iniciar ejecución');
  });

  it('should show a final-state note with no actions for terminal states', () => {
    for (const status of ['completado', 'rechazado', 'abandonado'] as const) {
      fixture.componentRef.setInput('plan', plan(status));
      fixture.detectChanges();
      const text = fixture.nativeElement.textContent as string;
      expect(text).toContain('Estado final');
      expect(fixture.nativeElement.querySelectorAll('button')).toHaveLength(0);
    }
  });

  it('should PATCH the status, emit the update, and toast on success', async () => {
    let emitted: TreatmentPlanResponse | undefined;
    fixture.componentInstance.planUpdated.subscribe((updated) => {
      emitted = updated;
    });
    fixture.componentRef.setInput('plan', plan('borrador'));
    fixture.detectChanges();
    clickButton(fixture, 'Presentar plan');
    const request = httpTesting.expectOne((call) =>
      call.url.endsWith('/api/v1/treatment-plans/plan-1/status'),
    );
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'presentado' });
    request.flush({ ...plan('borrador'), status: 'presentado' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(toasts.toasts().map((toast) => toast.message)).toContain('Plan presentado.');
    expect(emitted?.status).toBe('presentado');
    expect(fixture.componentInstance.pending()).toBeNull();
  });

  it('should require confirmation before rejecting', () => {
    fixture.componentRef.setInput('plan', plan('presentado'));
    fixture.detectChanges();
    clickButton(fixture, 'Rechazar');
    httpTesting.expectNone((call) => call.url.includes('/status'));
    expect(paneText()).toContain('Rechazar plan');
    expect(paneText()).toContain('no se puede deshacer');
  });

  it('should abandon after the confirmation step and close the modal', async () => {
    let emitted: TreatmentPlanResponse | undefined;
    fixture.componentInstance.planUpdated.subscribe((updated) => {
      emitted = updated;
    });
    fixture.componentRef.setInput('plan', plan('borrador'));
    fixture.detectChanges();
    clickButton(fixture, 'Abandonar');
    vi.useFakeTimers();
    try {
      clickInPane('Sí, abandonar plan');
      fixture.detectChanges();
      const request = httpTesting.expectOne((call) =>
        call.url.endsWith('/api/v1/treatment-plans/plan-1/status'),
      );
      expect(request.request.body).toEqual({ status: 'abandonado' });
      request.flush({ ...plan('borrador'), status: 'abandonado' });
      await fixture.whenStable();
      vi.advanceTimersByTime(300);
    } finally {
      vi.useRealTimers();
    }
    fixture.detectChanges();
    expect(toasts.toasts().map((toast) => toast.message)).toContain('Plan abandonado.');
    expect(emitted?.status).toBe('abandonado');
    expect(document.querySelector('.cdk-overlay-pane')).toBeNull();
  });

  it('should keep the confirmation modal open when the status request fails', async () => {
    fixture.componentRef.setInput('plan', plan('presentado'));
    fixture.detectChanges();
    clickButton(fixture, 'Rechazar');
    clickInPane('Sí, rechazar plan');
    fixture.detectChanges();

    const request = httpTesting.expectOne((call) =>
      call.url.endsWith('/api/v1/treatment-plans/plan-1/status'),
    );
    request.flush({ message: 'No se pudo rechazar.' }, { status: 400, statusText: 'Bad Request' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(paneText()).toContain('No se pudo rechazar.');
    expect(document.querySelector('.cdk-overlay-pane')).not.toBeNull();
  });

  it('should surface the backend message when a direct transition is rejected', async () => {
    fixture.componentRef.setInput('plan', plan('borrador'));
    fixture.detectChanges();
    clickButton(fixture, 'Presentar plan');
    const request = httpTesting.expectOne((call) => call.url.includes('/status'));
    request.flush(
      { message: "No se puede pasar de 'borrador' a 'aceptado'." },
      { status: 400, statusText: 'Bad Request' },
    );
    await fixture.whenStable();
    fixture.detectChanges();
    expect(toasts.toasts().map((toast) => toast.message)).toContain(
      "No se puede pasar de 'borrador' a 'aceptado'.",
    );
    expect(fixture.componentInstance.pending()).toBeNull();
  });

  it('should block a second transition while one is in flight', () => {
    fixture.componentRef.setInput('plan', plan('presentado'));
    fixture.detectChanges();
    clickButton(fixture, 'Aceptar plan');
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const postpone = buttons.find((button) => button.textContent?.includes('Posponer'));
    expect(postpone?.disabled).toBe(true);
    postpone?.click();
    fixture.detectChanges();
    const requests = httpTesting.match((call) => call.url.includes('/status'));
    expect(requests).toHaveLength(1);
    requests[0]?.flush({ ...plan('presentado'), status: 'aceptado' });
  });
});
