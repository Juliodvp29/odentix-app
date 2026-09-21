import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { PatientsService, toPatientParams } from './patients.service';
import { createInitialQuery } from '@shared/table/table-models';

async function flushEffects(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('toPatientParams', () => {
  it('should map the table query to backend params with a zero-based page', () => {
    expect(toPatientParams(createInitialQuery(10))).toEqual({ page: '0', size: '10' });
  });

  it('should include search and sort when present', () => {
    const params = toPatientParams({
      ...createInitialQuery(20),
      page: 3,
      search: 'ana',
      sortKey: 'name',
      sortDir: 'desc',
      filters: {},
    });
    expect(params).toEqual({ page: '2', size: '20', query: 'ana', sort: 'firstName,desc' });
  });
});

describe('PatientsService', () => {
  let service: PatientsService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PatientsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should fetch the first page on creation', async () => {
    await flushEffects();
    const request = httpTesting.expectOne((call) => call.url.endsWith('/api/v1/patients'));
    expect(request.request.params.get('page')).toBe('0');
    expect(request.request.params.get('size')).toBe('10');
    request.flush({ content: [{ firstName: 'Ada' }], totalElements: 1 });
    await flushEffects();
    expect(service.rows().length).toBe(1);
    expect(service.total()).toBe(1);
    expect(service.loading()).toBe(false);
  });

  it('should refetch when the query changes', async () => {
    await flushEffects();
    httpTesting.expectOne((call) => call.url.endsWith('/api/v1/patients')).flush({ content: [] });
    await flushEffects();
    service.updateQuery({ ...service.query(), page: 2, search: 'lui' });
    await flushEffects();
    const request = httpTesting.expectOne((call) => call.url.endsWith('/api/v1/patients'));
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('query')).toBe('lui');
    request.flush({ content: [], totalElements: 0 });
    await flushEffects();
    expect(service.total()).toBe(0);
  });

  it('should create a patient', async () => {
    await flushEffects();
    httpTesting.expectOne((call) => call.url.endsWith('/api/v1/patients')).flush({ content: [] });
    let createdId: string | undefined;
    service
      .create({ firstName: 'Ada', lastName: 'Luz' })
      .subscribe((patient) => (createdId = patient.id));
    const request = httpTesting.expectOne((call) => call.url.endsWith('/api/v1/patients'));
    expect(request.request.method).toBe('POST');
    request.flush({ id: 'patient-1' });
    await flushEffects();
    expect(createdId).toBe('patient-1');
  });

  it('should update a patient', async () => {
    await flushEffects();
    httpTesting.expectOne((call) => call.url.endsWith('/api/v1/patients')).flush({ content: [] });
    let updatedName: string | undefined;
    service
      .update('patient-1', { firstName: 'Ada' })
      .subscribe((patient) => (updatedName = patient.firstName));
    const request = httpTesting.expectOne((call) =>
      call.url.endsWith('/api/v1/patients/patient-1'),
    );
    expect(request.request.method).toBe('PATCH');
    request.flush({ firstName: 'Ada' });
    await flushEffects();
    expect(updatedName).toBe('Ada');
  });

  it('should reload the list', async () => {
    await flushEffects();
    httpTesting.expectOne((call) => call.url.endsWith('/api/v1/patients')).flush({ content: [] });
    await flushEffects();
    service.reload();
    await flushEffects();
    httpTesting.expectOne((call) => call.url.endsWith('/api/v1/patients')).flush({ content: [] });
    await flushEffects();
  });
});
