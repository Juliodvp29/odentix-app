import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OpportunitiesService } from './opportunities.service';

async function flushEffects(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('OpportunitiesService', () => {
  let service: OpportunitiesService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OpportunitiesService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OpportunitiesService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should fetch the tenant opportunities without filters', async () => {
    const ref = TestBed.runInInjectionContext(() => service.open());

    await flushEffects();
    const call = httpTesting.expectOne((request) => request.url.endsWith('/api/v1/opportunities'));
    expect(call.request.params.keys().length).toBe(0);
    call.flush([{ id: 'o-1', type: 'saldo_vencido', priority: 4 }]);

    await flushEffects();
    expect(ref.value()?.[0]?.type).toBe('saldo_vencido');
  });
});
