import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { AppointmentsService } from './appointments.service';
import { DateRange } from './agenda-dates';

const RANGE: DateRange = { from: '2026-09-21T00:00:00-05:00', to: '2026-09-21T23:59:59-05:00' };

const APPOINTMENTS = [
  {
    id: 'appointment-1',
    patientName: 'Ada Luz',
    professionalId: 'professional-1',
    professionalName: 'Dra. Ríos',
    startsAt: '2026-09-21T09:00:00',
    endsAt: '2026-09-21T09:30:00',
    status: 'programada',
  },
];

async function flushEffects(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AppointmentsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should fetch a range with from, to, and optional professional params', async () => {
    service.ensureRange(RANGE, 'professional-1');
    const request = httpTesting.expectOne((call) => call.url.endsWith('/api/v1/appointments'));
    expect(request.request.params.get('from')).toBe(RANGE.from);
    expect(request.request.params.get('to')).toBe(RANGE.to);
    expect(request.request.params.get('professionalId')).toBe('professional-1');
    request.flush(APPOINTMENTS);
    await flushEffects();
    expect(service.hasData(RANGE, 'professional-1')).toBe(true);
    expect(service.appointments(RANGE, 'professional-1')).toEqual(APPOINTMENTS);
  });

  it('should not refetch a cached range nor duplicate in-flight requests', async () => {
    service.ensureRange(RANGE, null);
    service.ensureRange(RANGE, null);
    const requests = httpTesting.match((call) => call.url.endsWith('/api/v1/appointments'));
    expect(requests).toHaveLength(1);
    requests[0]?.flush(APPOINTMENTS);
    await flushEffects();
    service.ensureRange(RANGE, null);
    httpTesting.expectNone((call) => call.url.endsWith('/api/v1/appointments'));
    expect(service.appointments(RANGE, null)).toEqual(APPOINTMENTS);
  });

  it('should prefetch the visible range with its neighbors', async () => {
    service.ensureVisibleWithNeighbors('day', '2026-09-22', null);
    const requests = httpTesting.match((call) => call.url.endsWith('/api/v1/appointments'));
    const froms = requests.map((request) => request.request.params.get('from')).sort();
    expect(froms).toEqual([
      '2026-09-21T00:00:00-05:00',
      '2026-09-22T00:00:00-05:00',
      '2026-09-23T00:00:00-05:00',
    ]);
    for (const request of requests) {
      request.flush([]);
    }
    await flushEffects();
  });

  it('should derive professional options from cached data', async () => {
    service.ensureRange(RANGE, null);
    httpTesting.expectOne((call) => call.url.endsWith('/api/v1/appointments')).flush(APPOINTMENTS);
    await flushEffects();
    expect(service.professionalOptions()).toEqual([{ id: 'professional-1', name: 'Dra. Ríos' }]);
  });

  it('should mark a failed range and reload it on retry', async () => {
    service.ensureRange(RANGE, null);
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/appointments'))
      .flush({}, { status: 500, statusText: 'Error' });
    await flushEffects();
    expect(service.rangeFailed(RANGE, null)).toBe(true);
    service.retry(RANGE, null);
    httpTesting.expectOne((call) => call.url.endsWith('/api/v1/appointments')).flush(APPOINTMENTS);
    await flushEffects();
    expect(service.rangeFailed(RANGE, null)).toBe(false);
    expect(service.appointments(RANGE, null)).toEqual(APPOINTMENTS);
  });
});
