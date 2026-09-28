import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { NotificationsService } from './notifications.service';

async function flushEffects(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('NotificationsService', () => {
  let service: NotificationsService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificationsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NotificationsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should fetch the recent window newest first', async () => {
    const ref = TestBed.runInInjectionContext(() => service.recent());

    await flushEffects();
    const call = httpTesting.expectOne((request) => request.url.endsWith('/api/v1/notifications'));
    expect(call.request.params.get('size')).toBe('100');
    expect(call.request.params.get('sort')).toBe('createdAt,desc');
    call.flush({
      content: [{ id: 'n-1', status: 'fallida', errorDetail: 'Timeout' }],
      totalElements: 1,
    });

    await flushEffects();
    expect(ref.value()?.totalElements).toBe(1);
    expect(ref.value()?.content?.[0]?.errorDetail).toBe('Timeout');
  });
});
