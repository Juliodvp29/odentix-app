import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { WaitlistEntryResponse, WaitlistService } from './waitlist.service';

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
};

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

  it('should fetch compatible candidates for an appointment', () => {
    let candidates: WaitlistEntryResponse[] = [];
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
