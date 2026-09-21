import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppointmentForm } from './appointment-form';

async function flushEffects(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function flushDebounce(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 350));
}

describe('AppointmentForm', () => {
  let fixture: ComponentFixture<AppointmentForm>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(AppointmentForm);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    await flushEffects();
    httpTesting.expectOne((call) => call.url.endsWith('/api/v1/patients')).flush({ content: [] });
  });

  afterEach(() => {
    httpTesting.verify();
  });

  function textInputs(): HTMLInputElement[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('app-text-input input'),
    ) as HTMLInputElement[];
  }

  function setInput(input: HTMLInputElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  function clickButton(label: string): void {
    const button = Array.from(fixture.nativeElement.querySelectorAll('button')).find((element) =>
      (element as HTMLButtonElement).textContent?.includes(label),
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
  }

  async function pickPatient(): Promise<void> {
    const search = fixture.nativeElement.querySelector(
      'input[aria-label="Buscar paciente"]',
    ) as HTMLInputElement;
    setInput(search, 'ada');
    await flushDebounce();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients'))
      .flush({ content: [{ id: 'patient-1', firstName: 'Ada', lastName: 'Luz' }] });
    await flushEffects();
    fixture.detectChanges();
    const option = fixture.nativeElement.querySelector('[role="option"]') as HTMLButtonElement;
    option.click();
    fixture.detectChanges();
  }

  it('should require patient and times before saving', async () => {
    clickButton('Agendar cita');
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Elige un paciente');
    httpTesting.expectNone((call) => call.method === 'POST');
  });

  it('should search and pick a patient', async () => {
    await pickPatient();
    expect(fixture.nativeElement.textContent).toContain('Ada Luz');
  });

  it('should post the appointment with backend instants and emit saved', async () => {
    let saved = false;
    fixture.componentInstance.saved.subscribe(() => (saved = true));
    await pickPatient();
    const inputs = textInputs();
    setInput(inputs[0]!, '2026-09-22T09:00');
    setInput(inputs[1]!, '2026-09-22T09:30');
    clickButton('Agendar cita');
    await flushEffects();
    const request = httpTesting.expectOne((call) => call.url.endsWith('/api/v1/appointments'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toMatchObject({
      patientId: 'patient-1',
      startsAt: '2026-09-22T09:00:00-05:00',
      endsAt: '2026-09-22T09:30:00-05:00',
    });
    request.flush({ id: 'appointment-1' });
    await flushEffects();
    expect(saved).toBe(true);
  });

  it('should reject an end before the start without posting', async () => {
    await pickPatient();
    const inputs = textInputs();
    setInput(inputs[0]!, '2026-09-22T10:00');
    setInput(inputs[1]!, '2026-09-22T09:30');
    clickButton('Agendar cita');
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('posterior al inicio');
    httpTesting.expectNone((call) => call.method === 'POST');
  });

  it('should explain a scheduling conflict on 409', async () => {
    await pickPatient();
    const inputs = textInputs();
    setInput(inputs[0]!, '2026-09-22T09:00');
    setInput(inputs[1]!, '2026-09-22T09:30');
    clickButton('Agendar cita');
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/appointments'))
      .flush({ error: 'Solapamiento' }, { status: 409, statusText: 'Conflict' });
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('se cruza con otra cita');
  });

  it('should emit cancelled without posting', async () => {
    let cancelled = false;
    fixture.componentInstance.cancelled.subscribe(() => (cancelled = true));
    clickButton('Cancelar');
    expect(cancelled).toBe(true);
    httpTesting.expectNone((call) => call.method === 'POST');
  });
});
