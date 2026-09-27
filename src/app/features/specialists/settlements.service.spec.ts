import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ApiClient } from '@core/api/api-client';
import { SettlementResponse } from './specialist-models';
import { SettlementsService, isPlanGateError } from './settlements.service';

const MOCK_SETTLEMENT: SettlementResponse = {
  id: 'set-1',
  specialistId: 'spec-1',
  periodStart: '2026-09-01',
  periodEnd: '2026-09-30',
  grossProductionCop: 1000000,
  feeAmountCop: 300000,
  status: 'pendiente',
};

describe('SettlementsService', () => {
  let httpTesting: HttpTestingController;
  let service: SettlementsService;
  let api: ApiClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SettlementsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ApiClient,
          useValue: {
            url: (path: string) => `http://localhost:8081${path}`,
            get: vi.fn(),
            post: vi.fn(),
            patch: vi.fn(),
          },
        },
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    service = TestBed.inject(SettlementsService);
    api = TestBed.inject(ApiClient);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should fetch the specialists list', () => {
    TestBed.runInInjectionContext(() => service.specialists());
    TestBed.tick();
    const request = httpTesting.expectOne((call) => call.url.endsWith('/api/v1/specialists'));
    expect(request.request.method).toBe('GET');
    request.flush([{ id: 'spec-1', fullName: 'María Gómez', feePercentage: 30 }]);
  });

  it('should fetch a specialist settlements history', () => {
    TestBed.runInInjectionContext(() => service.settlements(signal('spec-1')));
    TestBed.tick();
    const request = httpTesting.expectOne((call) =>
      call.url.endsWith('/api/v1/specialists/spec-1/settlements'),
    );
    expect(request.request.method).toBe('GET');
    request.flush([MOCK_SETTLEMENT]);
  });

  it('should post a settlement generation for a period', async () => {
    vi.spyOn(api, 'post').mockReturnValue(of(MOCK_SETTLEMENT));

    let result: SettlementResponse | undefined;
    service
      .generateSettlement('spec-1', { periodStart: '2026-09-01', periodEnd: '2026-09-30' })
      .subscribe((res) => {
        result = res;
      });

    expect(api.post).toHaveBeenCalledWith('/api/v1/specialists/spec-1/settlements', {
      periodStart: '2026-09-01',
      periodEnd: '2026-09-30',
    });
    expect(result).toEqual(MOCK_SETTLEMENT);
  });
});

describe('isPlanGateError', () => {
  it('should detect the gated-plan rejection', () => {
    expect(isPlanGateError(new HttpErrorResponse({ status: 403 }))).toBe(true);
    expect(isPlanGateError(new HttpErrorResponse({ status: 500 }))).toBe(false);
  });
});
