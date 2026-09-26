import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ApiClient } from '@core/api/api-client';
import { ConvertLeadResponse, LeadActivityResponse, LeadResponse } from './lead-models';
import { BOARD_PAGE_SIZE, LeadsService, isPlanGateError } from './leads.service';

const MOCK_LEAD: LeadResponse = {
  id: 'lead-1',
  fullName: 'Ana Torres',
  status: 'nuevo',
};

describe('LeadsService', () => {
  let service: LeadsService;
  let api: ApiClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LeadsService,
        {
          provide: ApiClient,
          useValue: {
            url: (path: string) => `http://localhost:8081${path}`,
            get: vi.fn(),
            patch: vi.fn(),
            post: vi.fn(),
          },
        },
      ],
    });
    service = TestBed.inject(LeadsService);
    api = TestBed.inject(ApiClient);
  });

  it('should fetch a snapshot page large enough for a pipeline board', () => {
    expect(BOARD_PAGE_SIZE).toBeGreaterThanOrEqual(100);
  });

  it('should patch the lead stage through the status endpoint', async () => {
    vi.spyOn(api, 'patch').mockReturnValue(of({ ...MOCK_LEAD, status: 'contactado' }));

    let result: LeadResponse | undefined;
    service.updateLeadStatus('lead-1', 'contactado').subscribe((res) => {
      result = res;
    });

    expect(api.patch).toHaveBeenCalledWith('/api/v1/leads/lead-1/status', {
      status: 'contactado',
    });
    expect(result?.status).toBe('contactado');
  });

  it('should post a contact activity against a lead', async () => {
    const activity: LeadActivityResponse = {
      id: 'act-1',
      leadId: 'lead-1',
      activityType: 'llamada',
      notes: 'Interesada en ortodoncia',
    };
    vi.spyOn(api, 'post').mockReturnValue(of(activity));

    let result: LeadActivityResponse | undefined;
    service
      .addActivity('lead-1', { activityType: 'llamada', notes: 'Interesada en ortodoncia' })
      .subscribe((res) => {
        result = res;
      });

    expect(api.post).toHaveBeenCalledWith('/api/v1/leads/lead-1/activities', {
      activityType: 'llamada',
      notes: 'Interesada en ortodoncia',
    });
    expect(result).toEqual(activity);
  });

  it('should post the conversion with patient data', async () => {
    const response: ConvertLeadResponse = {
      leadId: 'lead-1',
      patientId: 'patient-9',
      alreadyConverted: false,
    };
    vi.spyOn(api, 'post').mockReturnValue(of(response));

    let result: ConvertLeadResponse | undefined;
    service
      .convertLead('lead-1', { firstName: 'Ana', lastName: 'Torres' })
      .subscribe((res) => {
        result = res;
      });

    expect(api.post).toHaveBeenCalledWith('/api/v1/leads/lead-1/convert', {
      patient: { firstName: 'Ana', lastName: 'Torres' },
    });
    expect(result?.patientId).toBe('patient-9');
  });
});

describe('isPlanGateError', () => {
  it('should detect the gated-plan rejection', () => {
    expect(isPlanGateError(new HttpErrorResponse({ status: 403 }))).toBe(true);
    expect(isPlanGateError(new HttpErrorResponse({ status: 500 }))).toBe(false);
    expect(isPlanGateError(new Error('fail'))).toBe(false);
  });
});

describe('LeadsService metrics resources', () => {
  let httpTesting: HttpTestingController;
  let service: LeadsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LeadsService, provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    service = TestBed.inject(LeadsService);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should fetch conversion metrics for the selected range', () => {
    TestBed.runInInjectionContext(() =>
      service.conversionMetrics(
        signal('2026-09-01T00:00:00-05:00'),
        signal('2026-09-26T23:59:59-05:00'),
      ),
    );
    TestBed.tick();
    const request = httpTesting.expectOne((call) =>
      call.url.endsWith('/api/v1/leads/metrics/conversion'),
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('from')).toBe('2026-09-01T00:00:00-05:00');
    expect(request.request.params.get('to')).toBe('2026-09-26T23:59:59-05:00');
    request.flush({ totalLeads: 14, convertedLeads: 3, conversionRatePercentage: 21.4 });
  });

  it('should fetch response-time metrics for the selected range', () => {
    TestBed.runInInjectionContext(() =>
      service.responseTimeMetrics(
        signal('2026-09-01T00:00:00-05:00'),
        signal('2026-09-26T23:59:59-05:00'),
      ),
    );
    TestBed.tick();
    const request = httpTesting.expectOne((call) =>
      call.url.endsWith('/api/v1/leads/metrics/response-time'),
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('from')).toBe('2026-09-01T00:00:00-05:00');
    expect(request.request.params.get('to')).toBe('2026-09-26T23:59:59-05:00');
    request.flush({ totalLeads: 14, respondedLeads: 10, averageResponseTimeMinutes: 95 });
  });
});
