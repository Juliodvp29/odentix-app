import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '@app/app.routes';
import { PatientDetailPage } from './patient-detail';

const PATIENT = {
  id: 'patient-1',
  firstName: 'Ada',
  lastName: 'Luz',
  documentType: 'CC',
  documentNumber: '123',
  birthDate: '1990-05-06',
  phone: '3104567890',
  email: 'ada@example.com',
  active: true,
};

describe('PatientDetailPage', () => {
  let fixture: ComponentFixture<PatientDetailPage>;
  let httpTesting: HttpTestingController;

  async function flushListRequest(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    httpTesting.expectOne((call) => call.url.endsWith('/api/v1/patients')).flush({ content: [] });
  }

  async function flushDetail(): Promise<void> {
    await flushListRequest();
    httpTesting.expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1')).flush(PATIENT);
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientDetailPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(PatientDetailPage);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.componentRef.setInput('id', 'patient-1');
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should render the patient core data', async () => {
    await flushDetail();
    expect(fixture.nativeElement.textContent).toContain('Ada Luz');
    expect(fixture.nativeElement.textContent).toContain('CC 123');
    expect(fixture.nativeElement.textContent).toContain('Activo');
  });

  it('should render clinical records and odontogram in their tabs', async () => {
    await flushDetail();
    const tabs = Array.from(
      fixture.nativeElement.querySelectorAll('[role="tab"]'),
    ) as Array<HTMLButtonElement>;
    expect(tabs.length).toBe(4);
    tabs[1].click();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1/clinical-records'))
      .flush([{ id: 'record-1', chiefComplaint: 'Dolor molar' }]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Dolor molar');
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].getAttribute('aria-selected')).toBe('false');
    tabs[2].click();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1/odontogram'))
      .flush({
        patientId: 'patient-1',
        teeth: [
          {
            toothNumber: 16,
            entries: { diagnostico: [{ id: 'entry-1', condition: 'Caries oclusal' }] },
          },
        ],
      });
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Odontograma interactivo');
    expect(tabs[2].getAttribute('aria-selected')).toBe('true');
    const tooth = Array.from(
      fixture.nativeElement.querySelectorAll('button[aria-label^="Pieza"]'),
    ).find((element) =>
      (element as HTMLButtonElement).getAttribute('aria-label')?.startsWith('Pieza 16,'),
    ) as HTMLButtonElement;
    tooth.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Pieza 16');
    expect(fixture.nativeElement.textContent).toContain('Diagnóstico');
  });

  it('should render patient files in their tab', async () => {
    await flushDetail();
    const tabs = Array.from(
      fixture.nativeElement.querySelectorAll('[role="tab"]'),
    ) as Array<HTMLButtonElement>;
    tabs[3].click();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1/files'))
      .flush([{ id: 'file-1', fileName: 'radiografia.png' }]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('radiografia.png');
    expect(fixture.nativeElement.textContent).toContain('Subir archivo');
    expect(tabs[3].getAttribute('aria-selected')).toBe('true');
  });

  it('should move across tabs with arrow keys', async () => {
    await flushDetail();
    const tablist = fixture.nativeElement.querySelector('[role="tablist"]') as HTMLElement;
    tablist.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const incidental = httpTesting.match((call) =>
      call.url.endsWith('/api/v1/patients/patient-1/clinical-records'),
    );
    for (const request of incidental) {
      request.flush([]);
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    const tabs = Array.from(
      fixture.nativeElement.querySelectorAll('[role="tab"]'),
    ) as Array<HTMLButtonElement>;
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(tabs[1]);
  });

  it('should show an error with retry on load failure', async () => {
    await flushListRequest();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1'))
      .flush({}, { status: 500, statusText: 'Error' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar el paciente');
    const retry = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Reintentar'),
    ) as HTMLButtonElement;
    retry.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    httpTesting.expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1')).flush(PATIENT);
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ada Luz');
  });
});

describe('patient detail routing', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: (key: string) =>
        key === 'odentix.accessToken' || key === 'odentix.refreshToken' ? 'token' : null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    });
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(routes, withComponentInputBinding()),
      ],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    vi.unstubAllGlobals();
  });

  it('should land on the detail from a direct URL with a session', async () => {
    const httpTesting = TestBed.inject(HttpTestingController);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/patients/patient-9');
    await new Promise((resolve) => setTimeout(resolve, 0));
    const incidental = httpTesting.match((call) => call.url.endsWith('/api/v1/patients'));
    for (const request of incidental) {
      request.flush({ content: [] });
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-9'))
      .flush({ firstName: 'Elena', lastName: 'Ríos' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(harness.routeNativeElement?.textContent).toContain('Elena Ríos');
    expect(TestBed.inject(Router).url).toBe('/patients/patient-9');
  });
});
