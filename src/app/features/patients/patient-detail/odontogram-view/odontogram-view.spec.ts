import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OdontogramView } from './odontogram-view';

const ODONTOGRAM = {
  patientId: 'patient-1',
  teeth: [
    {
      toothNumber: 16,
      entries: {
        estado_actual: [{ id: 'entry-1', toothNumber: 16, condition: 'Sano' }],
        diagnostico: [{ id: 'entry-2', toothNumber: 16, condition: 'Caries oclusal' }],
      },
    },
    {
      toothNumber: 11,
      entries: {
        plan_propuesto: [{ id: 'entry-3', toothNumber: 11, condition: 'Corona' }],
        tratamiento_realizado: [{ id: 'entry-4', toothNumber: 11, condition: 'Limpieza' }],
      },
    },
  ],
};

async function flushEffects(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('OdontogramView', () => {
  let fixture: ComponentFixture<OdontogramView>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OdontogramView],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(OdontogramView);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.componentRef.setInput('patientId', 'patient-1');
    fixture.detectChanges();
    await flushEffects();
    httpTesting.expectOne((call) => call.url.endsWith('/api/v1/patients')).flush({ content: [] });
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should render teeth ordered with entries separated by type', async () => {
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1/odontogram'))
      .flush(ODONTOGRAM);
    await flushEffects();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Pieza 11');
    expect(text).toContain('Pieza 16');
    expect(text.indexOf('Pieza 11')).toBeLessThan(text.indexOf('Pieza 16'));
    expect(text).toContain('Estado actual');
    expect(text).toContain('Diagnóstico');
    expect(text).toContain('Plan propuesto');
    expect(text).toContain('Tratamiento realizado');
    expect(text).toContain('Caries oclusal');
  });

  it('should show skeletons while loading', async () => {
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-busy="true"]')).not.toBeNull();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1/odontogram'))
      .flush({ patientId: 'patient-1', teeth: [] });
    await flushEffects();
  });

  it('should show an empty state without teeth', async () => {
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1/odontogram'))
      .flush({ patientId: 'patient-1', teeth: [] });
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sin entradas en el odontograma');
  });

  it('should show an error with retry on load failure', async () => {
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1/odontogram'))
      .flush({}, { status: 500, statusText: 'Error' });
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar el odontograma');
    const retry = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Reintentar'),
    ) as HTMLButtonElement;
    retry.click();
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1/odontogram'))
      .flush(ODONTOGRAM);
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Pieza 16');
  });
});
