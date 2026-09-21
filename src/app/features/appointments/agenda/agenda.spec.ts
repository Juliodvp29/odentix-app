import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgendaPage } from './agenda';
import { addDays, todayIsoDate } from '../agenda-dates';

async function flushEffects(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function appointmentOn(day: string, id = 'appointment-1') {
  return {
    id,
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
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(AgendaPage);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
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
    expect(fixture.nativeElement.textContent).toContain('Sin citas programadas');
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
    clickButton(fixture, 'Siguiente');
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
});
