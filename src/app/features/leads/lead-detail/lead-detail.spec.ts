import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';
import { ToastService } from '@shared/toast/toast.service';
import { LeadActivityResponse, LeadResponse } from '../lead-models';
import { LeadConvertAction } from '../lead-convert-action/lead-convert-action';
import { LeadStageSelect } from '../lead-stage-select/lead-stage-select';
import { LeadsService } from '../leads.service';
import { LeadDetail } from './lead-detail';

const MOCK_LEAD: LeadResponse = {
  id: 'lead-1',
  fullName: 'Ana Torres',
  phone: '3001112233',
  source: 'Instagram',
  procedureOfInterest: 'Ortodoncia',
  estimatedValueCop: 2500000,
  status: 'contactado',
  assignedToName: 'Carlos Pérez',
  lastContactAt: '2026-09-25T12:00:00Z',
  createdAt: '2026-09-20T12:00:00Z',
};

const MOCK_HISTORY: LeadActivityResponse[] = [
  {
    id: 'act-1',
    leadId: 'lead-1',
    activityType: 'llamada',
    userName: 'Carlos Pérez',
    notes: 'Interesada en ortodoncia',
    createdAt: '2026-09-25T12:00:00Z',
  },
];

describe('LeadDetail', () => {
  let fixture: ComponentFixture<LeadDetail>;
  let detailReload: ReturnType<typeof vi.fn>;

  function setup(
    lead: LeadResponse | null = MOCK_LEAD,
    history: LeadActivityResponse[] = MOCK_HISTORY,
    loading = false,
    error = false,
  ) {
    const mockDetail = {
      value: signal(lead),
      isLoading: signal(loading),
      error: signal(error ? new Error('fail') : undefined),
      reload: vi.fn(),
    };
    detailReload = mockDetail.reload;
    const mockHistory = {
      value: signal(history),
      isLoading: signal(false),
      error: signal(undefined),
      reload: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [LeadDetail],
      providers: [
        provideRouter([]),
        {
          provide: LeadsService,
          useValue: {
            leadDetail: () => mockDetail,
            activities: () => mockHistory,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LeadDetail);
    fixture.componentRef.setInput('id', 'lead-1');
    fixture.detectChanges();
  }

  it('should render the lead header with its stage and timeline', () => {
    setup();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Ana Torres');
    expect(text).toContain('Contactado');
    expect(text).toContain('3001112233');
    expect(text).toContain('2.500.000');
    expect(text).toContain('Llamada');
    expect(text).toContain('Interesada en ortodoncia');
    expect(text).toContain('Historial de contacto (1)');
  });

  it('should render a clear empty state when no activities exist', () => {
    setup(MOCK_LEAD, []);
    expect(fixture.nativeElement.textContent).toContain('Sin actividades registradas');
  });

  it('should render loading skeleton while resolving', () => {
    setup(null, [], true);
    const loading = fixture.nativeElement.querySelector('[data-testid="detail-loading"]');
    expect(loading).not.toBeNull();
    expect(loading.getAttribute('aria-busy')).toBe('true');
  });

  it('should prepend a logged activity instantly with a toast', () => {
    setup();
    const toasts = TestBed.inject(ToastService);
    fixture.componentInstance.onActivityLogged({
      id: 'act-9',
      leadId: 'lead-1',
      activityType: 'whatsapp',
      notes: 'Pidió cotización',
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.timeline()[0]?.id).toBe('act-9');
    expect(fixture.nativeElement.textContent).toContain('Pidió cotización');
    expect(fixture.nativeElement.textContent).toContain('Historial de contacto (2)');
    expect(toasts.toasts().map((toast) => toast.message)).toContain('Contacto registrado.');
    expect(detailReload).toHaveBeenCalled();
  });

  it('should reload the detail when the stage selector reports a move', () => {
    setup();
    const selector = fixture.debugElement.query(By.directive(LeadStageSelect));
    expect(selector).not.toBeNull();
    selector.componentInstance.moved.emit({ id: 'lead-1', status: 'calificado' });
    expect(detailReload).toHaveBeenCalled();
  });

  it('should render the conversion action for the current lead', () => {
    setup();
    const action = fixture.debugElement.query(By.directive(LeadConvertAction));
    expect(action).not.toBeNull();
    expect(action.componentInstance.lead().id).toBe('lead-1');
    expect(fixture.nativeElement.textContent).toContain('Convertir en paciente');
  });

  it('should navigate to the patient record when the lead is converted', () => {
    setup();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const action = fixture.debugElement.query(By.directive(LeadConvertAction));
    action.componentInstance.converted.emit({ leadId: 'lead-1', patientId: 'patient-9' });

    expect(navigate).toHaveBeenCalledWith(['/patients', 'patient-9']);
  });
});
