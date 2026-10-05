import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { PlanService } from './plan.service';

async function flushEffects(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('PlanService', () => {
  let service: PlanService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PlanService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PlanService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should fetch the plan once and gate features from it', async () => {
    await flushEffects();
    httpTesting
      .expectOne((request) => request.url.endsWith('/api/v1/billing/plan'))
      .flush({
        planCode: 'esencial',
        features: [],
        limits: { max_patients: 150 },
      });
    await flushEffects();

    expect(service.hasFeature('opportunities_engine')).toBe(false);
    expect(service.limit('max_patients')).toBe(150);
    expect(service.ready()).toBe(true);
    httpTesting.expectNone((request) => request.url.endsWith('/api/v1/billing/plan'));
  });
});
