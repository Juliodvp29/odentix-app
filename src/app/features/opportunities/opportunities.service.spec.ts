import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
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

  it('should execute an action through the execute endpoint', async () => {
    let executed: unknown;
    service.executeAction('o-1', 'a-1').subscribe((action) => {
      executed = action;
    });

    const call = httpTesting.expectOne((request) =>
      request.url.endsWith('/api/v1/opportunities/o-1/actions/a-1/execute'),
    );
    expect(call.request.method).toBe('POST');
    call.flush({ id: 'a-1', executed: true, taskId: 't-9' });

    await flushEffects();
    expect((executed as { taskId?: string })?.taskId).toBe('t-9');
  });

  it('should fetch the recovered value for a range', async () => {
    const ref = TestBed.runInInjectionContext(() =>
      service.recoveredValue(
        signal('2026-08-30T00:00:00-05:00'),
        signal('2026-09-28T23:59:59-05:00'),
      ),
    );

    await flushEffects();
    const call = httpTesting.expectOne((request) =>
      request.url.endsWith('/api/v1/opportunities/recovered-value'),
    );
    expect(call.request.params.get('from')).toBe('2026-08-30T00:00:00-05:00');
    expect(call.request.params.get('to')).toBe('2026-09-28T23:59:59-05:00');
    call.flush([{ type: 'saldo_vencido', totalAmountCop: 150000, count: 2 }]);

    await flushEffects();
    expect(ref.value()?.[0]?.count).toBe(2);
  });

  it('should skip the request with empty bounds', async () => {
    TestBed.runInInjectionContext(() => service.recoveredValue(signal(''), signal('')));

    await flushEffects();
    httpTesting.expectNone((request) =>
      request.url.endsWith('/api/v1/opportunities/recovered-value'),
    );
  });
});
