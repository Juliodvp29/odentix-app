import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClinicalRecordsTimeline } from './clinical-records-timeline';

const RECORDS = [
  {
    id: 'record-1',
    chiefComplaint: 'Dolor molar',
    anamnesis: 'Dolor desde hace tres días',
    diagnosis: 'Caries oclusal',
    evolution: 'Se programa obturación',
    recordedAt: '2026-09-10T10:00:00Z',
  },
  {
    id: 'record-2',
    chiefComplaint: 'Control',
    recordedAt: '2026-08-01T10:00:00Z',
  },
];

async function flushEffects(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('ClinicalRecordsTimeline', () => {
  let fixture: ComponentFixture<ClinicalRecordsTimeline>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClinicalRecordsTimeline],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(ClinicalRecordsTimeline);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.componentRef.setInput('patientId', 'patient-1');
    fixture.detectChanges();
    await flushEffects();
    httpTesting.expectOne((call) => call.url.endsWith('/api/v1/patients')).flush({ content: [] });
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should render entries newest first', async () => {
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1/clinical-records'))
      .flush(RECORDS);
    await flushEffects();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Dolor molar');
    expect(text).toContain('Caries oclusal');
    expect(text).toContain('Control');
    expect(text.indexOf('Dolor molar')).toBeLessThan(text.indexOf('Control'));
  });

  it('should show skeletons while loading', async () => {
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-busy="true"]')).not.toBeNull();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1/clinical-records'))
      .flush([]);
    await flushEffects();
  });

  it('should show an empty state without entries', async () => {
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1/clinical-records'))
      .flush([]);
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sin entradas en la historia clínica');
  });

  it('should show an error with retry on load failure', async () => {
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1/clinical-records'))
      .flush({}, { status: 500, statusText: 'Error' });
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar la historia clínica');
    const retry = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Reintentar'),
    ) as HTMLButtonElement;
    retry.click();
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1/clinical-records'))
      .flush(RECORDS);
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Dolor molar');
  });
});
