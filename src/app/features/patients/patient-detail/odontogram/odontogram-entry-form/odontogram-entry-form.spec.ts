import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OdontogramEntryForm } from './odontogram-entry-form';

async function flushEffects(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('OdontogramEntryForm', () => {
  let fixture: ComponentFixture<OdontogramEntryForm>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OdontogramEntryForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(OdontogramEntryForm);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.componentRef.setInput('patientId', 'patient-1');
    fixture.componentRef.setInput('toothNumber', 16);
    fixture.detectChanges();
    await flushEffects();
    httpTesting.expectOne((call) => call.url.endsWith('/api/v1/patients')).flush({ content: [] });
  });

  afterEach(() => {
    httpTesting.verify();
  });

  function setCondition(value: string): void {
    const input = fixture.nativeElement.querySelector('app-text-input input') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  function clickButton(target: ComponentFixture<OdontogramEntryForm>, label: string): void {
    const button = Array.from(target.nativeElement.querySelectorAll('button')).find((element) =>
      (element as HTMLButtonElement).textContent?.includes(label),
    ) as HTMLButtonElement;
    button.click();
    target.detectChanges();
  }

  it('should require a condition before saving', async () => {
    clickButton(fixture, 'Guardar entrada');
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Describe la condición');
    httpTesting.expectNone((call) => call.url.endsWith('/api/v1/patients/patient-1/odontogram'));
  });

  it('should post one entry per selected surface and emit saved', async () => {
    let saved = false;
    fixture.componentInstance.saved.subscribe(() => (saved = true));
    setCondition('Caries oclusal');
    const distal = Array.from(
      fixture.nativeElement.querySelectorAll('input[type="checkbox"]'),
    ).find((element) => (element as HTMLInputElement).value === 'distal') as HTMLInputElement;
    distal.checked = true;
    distal.dispatchEvent(new Event('change', { bubbles: true }));
    clickButton(fixture, 'Guardar entrada');
    await flushEffects();
    const requests = httpTesting.match((call) =>
      call.url.endsWith('/api/v1/patients/patient-1/odontogram'),
    );
    expect(requests).toHaveLength(2);
    const surfaces = requests.map((request) => request.request.body.surface).sort();
    expect(surfaces).toEqual(['distal', 'oclusal']);
    expect(requests[0]?.request.body).toMatchObject({
      toothNumber: 16,
      entryType: 'diagnostico',
      condition: 'Caries oclusal',
    });
    for (const request of requests) {
      request.flush({ id: 'entry-1' });
    }
    await flushEffects();
    expect(saved).toBe(true);
  });

  it('should post a single surfaceless entry for a whole tooth', async () => {
    setCondition('Pieza ausente');
    const wholeLabel = Array.from(fixture.nativeElement.querySelectorAll('label')).find((element) =>
      (element as HTMLLabelElement).textContent?.includes('Pieza completa'),
    ) as HTMLLabelElement;
    const whole = wholeLabel.querySelector('input') as HTMLInputElement;
    whole.checked = true;
    whole.dispatchEvent(new Event('change', { bubbles: true }));
    clickButton(fixture, 'Guardar entrada');
    await flushEffects();
    const request = httpTesting.expectOne((call) =>
      call.url.endsWith('/api/v1/patients/patient-1/odontogram'),
    );
    expect(request.request.body).toMatchObject({
      toothNumber: 16,
      entryType: 'diagnostico',
      condition: 'Pieza ausente',
    });
    expect(request.request.body.surface).toBeUndefined();
    request.flush({ id: 'entry-1' });
    await flushEffects();
  });

  it('should show an error when saving fails', async () => {
    setCondition('Caries oclusal');
    clickButton(fixture, 'Guardar entrada');
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1/odontogram'))
      .flush({}, { status: 500, statusText: 'Error' });
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No pudimos guardar la entrada');
  });

  it('should emit cancelled without posting', async () => {
    let cancelled = false;
    fixture.componentInstance.cancelled.subscribe(() => (cancelled = true));
    clickButton(fixture, 'Cancelar');
    expect(cancelled).toBe(true);
    httpTesting.expectNone((call) => call.url.endsWith('/api/v1/patients/patient-1/odontogram'));
  });
});
