import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { ToastService } from '@shared/toast/toast.service';
import { LeadResponse } from '../lead-models';
import { LeadCard } from './lead-card';

const LEAD: LeadResponse = {
  id: 'lead-1',
  fullName: 'Ana Torres',
  source: 'Instagram',
  procedureOfInterest: 'Ortodoncia',
  estimatedValueCop: 2500000,
  status: 'nuevo',
  assignedToName: 'Carlos Pérez',
  lastContactAt: '2026-09-25T12:00:00Z',
};

describe('LeadCard', () => {
  let fixture: ComponentFixture<LeadCard>;
  let httpTesting: HttpTestingController;
  let toasts: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadCard],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(LeadCard);
    fixture.componentRef.setInput('lead', LEAD);
    fixture.detectChanges();
    httpTesting = TestBed.inject(HttpTestingController);
    toasts = TestBed.inject(ToastService);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should render the lead summary with assignee and value', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Ana Torres');
    expect(text).toContain('Instagram');
    expect(text).toContain('Ortodoncia');
    expect(text).toContain('2.500.000');
    expect(text).toContain('CP');
    expect(text).toContain('Carlos Pérez');
  });

  it('should link to the lead detail', () => {
    const link = fixture.nativeElement.querySelector(
      'a[href="/leads/lead-1"]',
    ) as HTMLAnchorElement;
    expect(link).not.toBeNull();
  });

  it('should offer every pipeline stage in the move selector', () => {
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
    const selector = fixture.nativeElement.querySelector('app-select');
    expect(selector).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Nuevo');
  });

  it('should flag converted leads with a patient link', () => {
    fixture.componentRef.setInput('lead', {
      ...LEAD,
      convertedPatientId: 'patient-9',
      convertedPatientName: 'Ana Torres',
    });
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Convertido');
    const link = fixture.nativeElement.querySelector(
      'a[href="/patients/patient-9"]',
    ) as HTMLAnchorElement;
    expect(link).not.toBeNull();
  });

  it('should ignore a move to the current stage without any request', async () => {
    await fixture.componentInstance.moveTo('nuevo');
    expect(fixture.componentInstance.moving()).toBe(false);
  });

  it('should PATCH the new stage, emit the update, and toast on success', async () => {
    let movedStatus: string | undefined;
    fixture.componentInstance.moved.subscribe((updated) => {
      movedStatus = updated.status;
    });
    const pending = fixture.componentInstance.moveTo('contactado');
    const request = httpTesting.expectOne((call) =>
      call.url.endsWith('/api/v1/leads/lead-1/status'),
    );
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'contactado' });
    request.flush({ ...LEAD, status: 'contactado' });
    await pending;
    await fixture.whenStable();
    fixture.detectChanges();
    expect(movedStatus).toBe('contactado');
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
