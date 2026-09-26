import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ToastService } from '@shared/toast/toast.service';
import { LeadStageSelect } from './lead-stage-select';

describe('LeadStageSelect', () => {
  let fixture: ComponentFixture<LeadStageSelect>;
  let httpTesting: HttpTestingController;
  let toasts: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadStageSelect],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(LeadStageSelect);
    fixture.componentRef.setInput('leadId', 'lead-1');
    fixture.componentRef.setInput('status', 'nuevo');
    fixture.componentRef.setInput('leadName', 'Ana Torres');
    fixture.detectChanges();
    httpTesting = TestBed.inject(HttpTestingController);
    toasts = TestBed.inject(ToastService);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should offer every pipeline stage', () => {
    expect(fixture.componentInstance.stageOptions().map((option) => option.label)).toEqual([
      'Nuevo',
      'Contactado',
      'Calificado',
      'Cita propuesta',
      'Cita agendada',
      'Cita asistida',
      'Tratamiento propuesto',
      'Tratamiento aceptado',
      'Perdido',
    ]);
  });

  it('should ignore a move to the current stage without any request', async () => {
    await fixture.componentInstance.moveTo('nuevo');
    expect(fixture.componentInstance.moving()).toBe(false);
  });

  it('should PATCH the new stage, emit the update, and toast on success', async () => {
    let moved: { id: string; status: string } | undefined;
    fixture.componentInstance.moved.subscribe((event) => {
      moved = event;
    });
    const pending = fixture.componentInstance.moveTo('contactado');
    const request = httpTesting.expectOne((call) =>
      call.url.endsWith('/api/v1/leads/lead-1/status'),
    );
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'contactado' });
    request.flush({ id: 'lead-1', status: 'contactado' });
    await pending;
    await fixture.whenStable();
    fixture.detectChanges();
    expect(moved).toEqual({ id: 'lead-1', status: 'contactado' });
    expect(toasts.toasts().map((toast) => toast.message)).toContain(
      'Ana Torres movido a Contactado.',
    );
    expect(fixture.componentInstance.moving()).toBe(false);
  });

  it('should toast the backend message when the move is rejected', async () => {
    const pending = fixture.componentInstance.moveTo('perdido');
    const request = httpTesting.expectOne((call) => call.url.includes('/status'));
    request.flush({ message: 'No permitido.' }, { status: 400, statusText: 'Bad Request' });
    await pending;
    fixture.detectChanges();
    expect(toasts.toasts().map((toast) => toast.message)).toContain('No permitido.');
    expect(fixture.componentInstance.moving()).toBe(false);
  });
});
