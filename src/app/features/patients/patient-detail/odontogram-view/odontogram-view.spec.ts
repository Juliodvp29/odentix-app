import { Dialog } from '@angular/cdk/dialog';
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
    TestBed.inject(Dialog).closeAll();
    document.querySelectorAll('.cdk-overlay-container').forEach((element) => element.remove());
    httpTesting.verify();
  });

  async function flushOdontogram(payload: typeof ODONTOGRAM = ODONTOGRAM) {
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1/odontogram'))
      .flush(payload);
    await flushEffects();
    fixture.detectChanges();
  }

  function toothButton(tooth: number): HTMLButtonElement {
    return Array.from(fixture.nativeElement.querySelectorAll('button[aria-label^="Pieza"]')).find(
      (element) =>
        (element as HTMLButtonElement).getAttribute('aria-label')?.startsWith(`Pieza ${tooth},`),
    ) as HTMLButtonElement;
  }

  it('should render the chart with the clinical convention and a selection prompt', async () => {
    await flushOdontogram();
    const buttons = fixture.nativeElement.querySelectorAll('button[aria-label^="Pieza"]');
    expect(buttons.length).toBe(32);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('CONVENCIÓN CLÍNICA ADOPTADA');
    expect(text).toContain('Rojo: Diagnóstico');
    expect(text).toContain('Selecciona una pieza');
  });

  it('should show the tooth panel on selection', async () => {
    await flushOdontogram();
    toothButton(16).click();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Pieza 16');
    expect(text).toContain('Requiere atención');
    expect(text).toContain('Caries oclusal');
  });

  it('should save a new entry from the modal and reload the chart', async () => {
    await flushOdontogram();
    toothButton(16).click();
    fixture.detectChanges();
    const add = Array.from(fixture.nativeElement.querySelectorAll('button')).find((element) =>
      (element as HTMLButtonElement).textContent?.includes('Agregar entrada'),
    ) as HTMLButtonElement;
    add.click();
    await flushEffects();
    fixture.detectChanges();
    const dialogInput = document.body.querySelector(
      '.modal-pane app-text-input input',
    ) as HTMLInputElement;
    expect(dialogInput).not.toBeNull();
    dialogInput.value = 'Obturación resina';
    dialogInput.dispatchEvent(new Event('input', { bubbles: true }));
    const save = Array.from(document.body.querySelectorAll('.modal-pane button')).find((element) =>
      (element as HTMLButtonElement).textContent?.includes('Guardar entrada'),
    ) as HTMLButtonElement;
    save.click();
    await flushEffects();
    const post = httpTesting.expectOne((call) =>
      call.url.endsWith('/api/v1/patients/patient-1/odontogram'),
    );
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toMatchObject({ toothNumber: 16, condition: 'Obturación resina' });
    post.flush({ id: 'entry-3' });
    await flushEffects();
    await flushEffects();
    // match() instead of expectOne(): the reloaded request is open here but
    // expectOne() does not observe it in this flow.
    const reloads = httpTesting.match((call) =>
      call.url.endsWith('/api/v1/patients/patient-1/odontogram'),
    );
    expect(reloads).toHaveLength(1);
    reloads[0]?.flush(ODONTOGRAM);
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Caries oclusal');
  });

  it('should show skeletons while loading', async () => {
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-busy="true"]')).not.toBeNull();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1/odontogram'))
      .flush(ODONTOGRAM);
    await flushEffects();
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
    expect(fixture.nativeElement.querySelectorAll('button[aria-label^="Pieza"]').length).toBe(32);
  });
});
