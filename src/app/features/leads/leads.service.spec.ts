import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ApiClient } from '@core/api/api-client';
import { LeadResponse } from './lead-models';
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
});

describe('isPlanGateError', () => {
  it('should detect the gated-plan rejection', () => {
    expect(isPlanGateError(new HttpErrorResponse({ status: 403 }))).toBe(true);
    expect(isPlanGateError(new HttpErrorResponse({ status: 500 }))).toBe(false);
    expect(isPlanGateError(new Error('fail'))).toBe(false);
  });
});
