import { Dialog } from '@angular/cdk/dialog';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AgendaPage } from './agenda';
import { addDays, todayIsoDate } from '../agenda-dates';

async function flushEffects(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function appointmentOn(day: string, id = 'appointment-1') {
  return {
    id,
    patientId: 'patient-1',
    patientName: 'Ada Luz',
    professionalId: 'professional-1',
    professionalName: 'Dra. Ríos',
    startsAt: `${day}T09:00:00`,
    endsAt: `${day}T09:30:00`,
    status: 'programada',
  };
}

function clickButton(fixture: ComponentFixture<AgendaPage>, label: string): void {
  const button = Array.from(fixture.nativeElement.querySelectorAll('button')).find((element) =>
    (element as HTMLButtonElement).textContent?.includes(label),
  ) as HTMLButtonElement;
  button.click();
  fixture.detectChanges();
}

describe('AgendaPage', () => {
  let fixture: ComponentFixture<AgendaPage>;
  let httpTesting: HttpTestingController;
  const today = todayIsoDate();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgendaPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(AgendaPage);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(Dialog).closeAll();
    document.querySelectorAll('.cdk-overlay-container').forEach((element) => element.remove());
    httpTesting.verify();
  });

  async function flushInitial(visible: unknown[] = [], neighbor: unknown[] = []) {
    await flushEffects();
    const requests = httpTesting.match((call) => call.url.endsWith('/api/v1/appointments'));
    expect(requests).toHaveLength(3);
    requests[0]?.flush(visible);
    requests[1]?.flush(neighbor);
    requests[2]?.flush(neighbor);
    await flushEffects();
    fixture.detectChanges();
  }

  it("should render today's appointments", async () => {
    await flushInitial([appointmentOn(today)]);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Agenda');
    expect(text).toContain('Ada Luz');
    expect(text).toContain('Programada');
  });

  it('should show an empty state without appointments', async () => {
    await flushInitial([]);
    // In day view, the empty state uses a contextual message instead of a
    // generic "Sin citas programadas" heading (that one is reserved for week/month).
    expect(fixture.nativeElement.textContent).toContain(
      'No hay citas para este día',
    );
  });

  it('should navigate to the next day instantly from the prefetch', async () => {
    const tomorrow = addDays(today, 1);
    const dayAfter = addDays(today, 2);
    await flushEffects();
    const initial = httpTesting.match((call) => call.url.endsWith('/api/v1/appointments'));
    expect(initial).toHaveLength(3);
    initial[0]?.flush([]);
    initial[1]?.flush([]);
    initial[2]?.flush([appointmentOn(tomorrow)]);
    await flushEffects();
    fixture.detectChanges();
    // Navigation is now via aria-label icon buttons, not text buttons.
    const nextBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Período siguiente"]',
    ) as HTMLButtonElement;
    nextBtn.click();
    fixture.detectChanges();
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ada Luz');
    const pending = httpTesting.match((call) => call.url.endsWith('/api/v1/appointments'));
    expect(pending).toHaveLength(1);
    expect(pending[0]?.request.params.get('from')).toBe(`${dayAfter}T00:00:00-05:00`);
    pending[0]?.flush([]);
    await flushEffects();
  });

  it('should render seven columns in week view', async () => {
    await flushInitial([]);
    clickButton(fixture, 'Semana');
    await flushEffects();
    const requests = httpTesting.match((call) => call.url.endsWith('/api/v1/appointments'));
    expect(requests).toHaveLength(3);
    requests[0]?.flush([appointmentOn(today)]);
    requests[1]?.flush([]);
    requests[2]?.flush([]);
    await flushEffects();
    fixture.detectChanges();
    const columns = fixture.nativeElement.querySelectorAll('section[aria-label]');
    expect(columns.length).toBe(7);
    expect(fixture.nativeElement.textContent).toContain('Ada Luz');
  });

  it('should filter by professional through the backend', async () => {
    await flushInitial([appointmentOn(today)]);
    const select = fixture.nativeElement.querySelector(
      '#agenda-professional-native',
    ) as HTMLSelectElement;
    select.value = 'professional-1';
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await flushEffects();
    const requests = httpTesting.match((call) => call.url.endsWith('/api/v1/appointments'));
    expect(requests).toHaveLength(3);
    for (const request of requests) {
      expect(request.request.params.get('professionalId')).toBe('professional-1');
      request.flush([]);
    }
    await flushEffects();
  });

  it('should show an error with retry on load failure', async () => {
    await flushEffects();
    const initial = httpTesting.match((call) => call.url.endsWith('/api/v1/appointments'));
    expect(initial).toHaveLength(3);
    initial[0]?.flush({}, { status: 500, statusText: 'Error' });
    initial[1]?.flush([]);
    initial[2]?.flush([]);
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar la agenda');
    clickButton(fixture, 'Reintentar');
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/appointments'))
      .flush([appointmentOn(today)]);
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ada Luz');
  });

  it('should create an appointment from the modal and refresh the agenda', async () => {
    await flushInitial([]);
    clickButton(fixture, 'Nueva cita');
    await flushEffects();
    fixture.detectChanges();
    httpTesting.expectOne((call) => call.url.endsWith('/api/v1/patients')).flush({ content: [] });
    const dialogForm = document.body.querySelector(
      '.modal-pane app-appointment-form',
    ) as HTMLElement;
    expect(dialogForm).not.toBeNull();
    const search = dialogForm.querySelector(
      'input[aria-label="Buscar paciente"]',
    ) as HTMLInputElement;
    search.value = 'ada';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 350));
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients'))
      .flush({ content: [{ id: 'patient-1', firstName: 'Ada', lastName: 'Luz' }] });
    await flushEffects();
    fixture.detectChanges();
    (dialogForm.querySelector('[role="option"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const inputs = Array.from(
      dialogForm.querySelectorAll('app-text-input input'),
    ) as HTMLInputElement[];
    inputs[0]!.value = `${today}T09:00`;
    inputs[0]!.dispatchEvent(new Event('input', { bubbles: true }));
    inputs[1]!.value = `${today}T09:30`;
    inputs[1]!.dispatchEvent(new Event('input', { bubbles: true }));
    const save = Array.from(dialogForm.querySelectorAll('button')).find((element) =>
      (element as HTMLButtonElement).textContent?.includes('Agendar cita'),
    ) as HTMLButtonElement;
    save.click();
    await flushEffects();
    const post = httpTesting.expectOne((call) => call.url.endsWith('/api/v1/appointments'));
    expect(post.request.method).toBe('POST');
    post.flush({ id: 'appointment-9' });
    await flushEffects();
    const reloaded = httpTesting.match((call) => call.url.endsWith('/api/v1/appointments'));
    expect(reloaded).toHaveLength(3);
    reloaded[0]?.flush([appointmentOn(today, 'appointment-9')]);
    reloaded[1]?.flush([]);
    reloaded[2]?.flush([]);
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ada Luz');
  });

  it('should render the month view and jump to a picked day', async () => {
    // Seed the day cache with an appointment so the day view shows it after
    // the jump (no new HTTP requests — the cache is already warm).
    await flushEffects();
    const initial = httpTesting.match((call) => call.url.endsWith('/api/v1/appointments'));
    expect(initial).toHaveLength(3);
    initial[0]?.flush([appointmentOn(today)]); // visible day
    initial[1]?.flush([]);
    initial[2]?.flush([]);
    await flushEffects();
    fixture.detectChanges();

    // Switch to month view.
    clickButton(fixture, 'Mes');
    await flushEffects();
    const monthRequests = httpTesting.match((call) => call.url.endsWith('/api/v1/appointments'));
    expect(monthRequests).toHaveLength(3);
    monthRequests[0]?.flush([appointmentOn(today)]);
    monthRequests[1]?.flush([]);
    monthRequests[2]?.flush([]);
    await flushEffects();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('[role="gridcell"]').length).toBe(42);
    expect(fixture.nativeElement.textContent).toContain('1 cita');

    // Click today's cell — jumps back to day view using the cached day data.
    const dayNumber = Number(today.slice(8, 10));
    const cells = Array.from(
      fixture.nativeElement.querySelectorAll('[role="gridcell"]'),
    ) as HTMLButtonElement[];
    cells.find((cell) => cell.getAttribute('aria-label')?.startsWith(`${dayNumber},`))?.click();
    await flushEffects();
    fixture.detectChanges();

    // Day ranges are already cached from the initial load, so no new requests
    // should be issued.
    httpTesting.expectNone((call) => call.url.endsWith('/api/v1/appointments'));

    // The appointment loaded at startup is visible in the day view.
    expect(fixture.nativeElement.textContent).toContain('Ada Luz');
  });

  it('should filter by room client-side without new requests', async () => {
    const box1 = { ...appointmentOn(today, 'appointment-1'), roomId: 'room-1', roomName: 'Box 1' };
    const box2 = { ...appointmentOn(today, 'appointment-2'), roomId: 'room-2', roomName: 'Box 2' };
    await flushInitial([box1, box2]);
    expect(fixture.nativeElement.textContent).toContain('2 citas');
    const native = fixture.nativeElement.querySelector('#agenda-room-native') as HTMLSelectElement;
    native.value = 'room-1';
    native.dispatchEvent(new Event('input', { bubbles: true }));
    native.dispatchEvent(new Event('change', { bubbles: true }));
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('1 cita');
    httpTesting.expectNone((call) => call.url.endsWith('/api/v1/appointments'));
  });

  it('should search patients within the day', async () => {
    await flushInitial([
      appointmentOn(today, 'appointment-1'),
      { ...appointmentOn(today, 'appointment-2'), patientName: 'Luis Pérez' },
    ]);
    const search = fixture.nativeElement.querySelector(
      'input[aria-label="Buscar paciente en el día"]',
    ) as HTMLInputElement;
    search.value = 'luis';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Luis Pérez');
    expect(text).not.toContain('Ada Luz');
  });

  it('should show the detail panel on appointment selection', async () => {
    await flushInitial([appointmentOn(today)]);
    const block = Array.from(fixture.nativeElement.querySelectorAll('button')).find((element) =>
      (element as HTMLButtonElement).textContent?.includes('Ada Luz'),
    ) as HTMLButtonElement;
    block.click();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    // The detail panel now shows patient name + status badge (no static header).
    expect(text).toContain('Ada Luz');
    expect(text).toContain('Programada');
    expect(text).toContain('Ficha clínica');
  });

  it('should open the create modal from a free slot', async () => {
    // A column must exist in the time grid for the free-slot button to render.
    await flushInitial([appointmentOn(today)]);
    const free = fixture.nativeElement.querySelector(
      'button[aria-label="Agendar en este espacio libre"]',
    ) as HTMLButtonElement;
    free.click();
    await flushEffects();
    fixture.detectChanges();
    // AppointmentForm fires an initial patients search when opened — flush it.
    httpTesting.expectOne((call) => call.url.endsWith('/api/v1/patients')).flush({ content: [] });
    expect(document.body.querySelector('.modal-pane app-appointment-form')).not.toBeNull();
  });
});
