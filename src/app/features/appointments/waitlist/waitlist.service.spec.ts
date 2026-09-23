import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AppointmentResponse } from '../appointments.service';
import { createInitialQuery } from '@shared/table/table-models';
import { toWaitlistParams, WaitlistService } from './waitlist.service';

const CANDIDATE = {
  id: 'entry-1',
  tenantId: 'tenant-1',
  patientId: 'patient-1',
  patientName: 'Ana Torres',
  patientPhone: '3001234567',
  procedureId: 'procedure-1',
  desiredFrom: '2026-09-22T09:00:00Z',
  desiredTo: '2026-09-22T10:00:00Z',
  status: 'activa' as const,
  createdAt: '2026-09-20T09:00:00Z',
};

async function flushEffects(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('toWaitlistParams', () => {
  it('should map the one-based table page to a zero-based API page', () => {
    expect(toWaitlistParams(createInitialQuery(20))).toEqual({ page: '0', size: '20' });
  });

  it('should include search, status, and createdAt sorting', () => {
    expect(
      toWaitlistParams({
        ...createInitialQuery(10),
        page: 3,
        search: ' ana ',
        sortKey: 'createdAt',
        sortDir: 'desc',
        filters: { status: 'contactado' },
      }),
    ).toEqual({
      page: '2',
      size: '10',
      query: 'ana',
      status: 'contactado',
      sort: 'createdAt,desc',
    });
  });
});

describe('WaitlistService', () => {
  let service: WaitlistService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WaitlistService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should clear the list query when its route scope starts', () => {
    service.updateQuery({
      page: 3,
      pageSize: 10,
      search: 'tenant-old',
      sortKey: 'createdAt',
      sortDir: 'desc',
      filters: { status: 'activa' },
    });

    service.reset();

    expect(service.query()).toEqual(createInitialQuery(20));
  });

  it('should fetch the enabled list with table parameters', async () => {
    service.enableList();
    await flushEffects();

    const request = httpTesting.expectOne((call) => call.url.endsWith('/api/v1/waitlist'));
    expect(request.request.params.get('page')).toBe('0');
    expect(request.request.params.get('size')).toBe('20');
    request.flush({ content: [CANDIDATE], totalElements: 1 });
    await flushEffects();

    expect(service.rows()).toEqual([CANDIDATE]);
    expect(service.total()).toBe(1);
  });

  it('should register a waitlist entry', () => {
    let createdId: string | undefined;
    service
      .addEntry({
        patientId: 'patient-1',
        procedureId: 'procedure-1',
        desiredFrom: '2026-09-22T09:00:00-05:00',
        desiredTo: '2026-09-22T10:00:00-05:00',
      })
      .subscribe((entry) => (createdId = entry.id));

    const request = httpTesting.expectOne((call) => call.url.endsWith('/api/v1/waitlist'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      patientId: 'patient-1',
      procedureId: 'procedure-1',
      desiredFrom: '2026-09-22T09:00:00-05:00',
      desiredTo: '2026-09-22T10:00:00-05:00',
    });
    request.flush(CANDIDATE);
    expect(createdId).toBe('entry-1');
  });

  it('should list entries through the observable API', () => {
    let total: number | undefined;
    service.list(createInitialQuery(10)).subscribe((page) => (total = page.totalElements));

    const request = httpTesting.expectOne((call) => call.url.endsWith('/api/v1/waitlist'));
    expect(request.request.params.get('page')).toBe('0');
    request.flush({ content: [CANDIDATE], totalElements: 1 });
    expect(total).toBe(1);
  });

  it('should fetch one entry by id', () => {
    let patientId: string | undefined;
    service.getById('entry-1').subscribe((entry) => (patientId = entry.patientId));

    const request = httpTesting.expectOne((call) => call.url.endsWith('/api/v1/waitlist/entry-1'));
    expect(request.request.method).toBe('GET');
    request.flush(CANDIDATE);
    expect(patientId).toBe('patient-1');
  });

  it('should patch lifecycle status and update the cached row', async () => {
    service.enableList();
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/waitlist'))
      .flush({
        content: [CANDIDATE],
        totalElements: 1,
      });
    await flushEffects();

    let updatedStatus: string | undefined;
    service
      .updateStatus('entry-1', 'contactado')
      .subscribe((entry) => (updatedStatus = entry.status));
    const request = httpTesting.expectOne((call) =>
      call.url.endsWith('/api/v1/waitlist/entry-1/status'),
    );
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'contactado', discardReason: undefined });
    request.flush({ ...CANDIDATE, status: 'contactado', contactedAt: '2026-09-23T09:00:00Z' });
    await flushEffects();

    expect(updatedStatus).toBe('contactado');
    expect(service.rows()[0]?.status).toBe('contactado');
  });

  it('should convert an entry and mark its cached row as converted', async () => {
    service.enableList();
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/waitlist'))
      .flush({
        content: [CANDIDATE],
        totalElements: 1,
      });
    await flushEffects();

    const appointment: AppointmentResponse = {
      id: 'appointment-2',
      patientId: 'patient-1',
      startsAt: '2026-09-22T09:00:00Z',
      endsAt: '2026-09-22T10:00:00Z',
      status: 'programada',
    };
    let convertedId: string | undefined;
    service
      .convert('entry-1', { sourceAppointmentId: 'appointment-1', notes: 'Recuperada' })
      .subscribe((result) => (convertedId = result.id));

    const request = httpTesting.expectOne((call) =>
      call.url.endsWith('/api/v1/waitlist/entry-1/convert'),
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      sourceAppointmentId: 'appointment-1',
      notes: 'Recuperada',
    });
    request.flush(appointment);
    await flushEffects();

    expect(convertedId).toBe('appointment-2');
    expect(service.rows()[0]?.status).toBe('convertida');
    expect(service.rows()[0]?.convertedAppointmentId).toBe('appointment-2');
  });

  it('should fetch compatible candidates for an appointment', () => {
    let candidates: unknown[] = [];
    service.getCandidates('appointment-1').subscribe((result) => (candidates = result));

    const request = httpTesting.expectOne((call) =>
      call.url.endsWith('/api/v1/appointments/appointment-1/waitlist-candidates'),
    );
    expect(request.request.method).toBe('GET');
    request.flush([CANDIDATE]);
    expect(candidates).toEqual([CANDIDATE]);
  });

  it('should propagate candidate request errors', () => {
    let error: unknown;
    service.getCandidates('appointment-1').subscribe({
      error: (value) => (error = value),
    });

    httpTesting
      .expectOne((call) => call.url.endsWith('/waitlist-candidates'))
      .flush({}, { status: 403, statusText: 'Forbidden' });
    expect(error).toMatchObject({ status: 403 });
  });
});
