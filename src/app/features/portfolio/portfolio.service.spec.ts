import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { PortfolioService, isPlanGateError } from './portfolio.service';

describe('PortfolioService', () => {
  let httpTesting: HttpTestingController;
  let service: PortfolioService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PortfolioService, provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    service = TestBed.inject(PortfolioService);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should fetch the consolidated summary', () => {
    TestBed.runInInjectionContext(() => service.summary());
    TestBed.tick();
    const request = httpTesting.expectOne((call) =>
      call.url.endsWith('/api/v1/portfolio/summary'),
    );
    expect(request.request.method).toBe('GET');
    request.flush({ totalAmountCop: 900000, paidAmountCop: 300000 });
  });
});

describe('isPlanGateError', () => {
  it('should detect the gated-plan rejection', () => {
    expect(isPlanGateError(new HttpErrorResponse({ status: 403 }))).toBe(true);
    expect(isPlanGateError(new HttpErrorResponse({ status: 500 }))).toBe(false);
  });
});
