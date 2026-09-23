import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WaitlistListPage } from './waitlist-list';

const ENTRY = {
  id: 'entry-1',
  patientId: 'patient-1',
  patientName: 'Ana Torres',
  patientPhone: '3001234567',
  procedureId: 'procedure-1',
  desiredFrom: '2026-09-22T14:00:00Z',
  desiredTo: '2026-09-22T15:00:00Z',
  status: 'activa' as const,
  createdAt: '2026-09-20T09:00:00Z',
};

async function flushEffects(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function settleModal(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));
}

describe('WaitlistListPage', () => {
  let fixture: ComponentFixture<WaitlistListPage>;
  let httpTesting: HttpTestingController;

  const bodyText = (): string => fixture.nativeElement.textContent as string;

  async function flushList(content = [ENTRY], totalElements = content.length): Promise<void> {
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/waitlist'))
      .flush({ content, totalElements });
    await flushEffects();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaitlistListPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(WaitlistListPage);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
    document.querySelectorAll('.cdk-overlay-container').forEach((element) => element.remove());
  });

  it('should render the waitlist table with linked patient details', async () => {
    await flushList();

    expect(bodyText()).toContain('Lista de espera');
    expect(bodyText()).toContain('Ana Torres');
    expect(bodyText()).toContain('3001234567');
    expect(bodyText()).toContain('Activa');
    expect(bodyText()).toContain('22/09/2026');
    expect(fixture.nativeElement.querySelector('a[href="/patients/patient-1"]')).toBeTruthy();
  });

  it('should send search, status, page, and createdAt sort parameters', async () => {
    await flushList();
    fixture.componentInstance.onQueryChange({
      page: 2,
      pageSize: 10,
      search: 'ana',
      sortKey: 'createdAt',
      sortDir: 'desc',
      filters: { status: 'activa' },
    });
    await flushEffects();

    const request = httpTesting.expectOne((call) => call.url.endsWith('/api/v1/waitlist'));
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('query')).toBe('ana');
    expect(request.request.params.get('status')).toBe('activa');
    expect(request.request.params.get('sort')).toBe('createdAt,desc');
    request.flush({ content: [], totalElements: 0 });
    await flushEffects();
    fixture.detectChanges();
  });

  it('should show table skeletons while loading', async () => {
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.skeleton').length).toBeGreaterThan(0);

    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/waitlist'))
      .flush({
        content: [],
        totalElements: 0,
      });
    await flushEffects();
  });

  it('should show an inline error and retry the list request', async () => {
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/waitlist'))
      .flush({}, { status: 500, statusText: 'Server Error' });
    await flushEffects();
    fixture.detectChanges();

    expect(bodyText()).toContain('No pudimos cargar la lista de espera');
    const retry = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Reintentar'),
    ) as HTMLButtonElement;
    retry.click();
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/waitlist'))
      .flush({
        content: [],
        totalElements: 0,
      });
    await flushEffects();
    fixture.detectChanges();
    expect(bodyText()).toContain('No hay entradas para mostrar');
  });

  it('should open the global create dialog', async () => {
    await flushList();
    const button = Array.from(fixture.nativeElement.querySelectorAll('button')).find((element) =>
      (element as HTMLButtonElement).textContent?.includes('Nueva entrada'),
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    await settleModal();
    httpTesting.expectOne((call) => call.url.endsWith('/api/v1/patients')).flush({ content: [] });

    const dialog = document.querySelector('.cdk-overlay-pane') as HTMLElement;
    expect(dialog.textContent).toContain('Nueva entrada en lista de espera');
    expect(dialog.textContent).toContain('Buscar paciente');
  });
});
