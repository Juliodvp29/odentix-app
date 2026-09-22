import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastService } from '@shared/toast/toast.service';
import { AppointmentResponse } from '../../appointments.service';
import { AgendaStatusActions } from './agenda-status-actions';

function appointment(status: string): AppointmentResponse {
  return {
    id: 'appointment-1',
    patientName: 'Ada Luz',
    startsAt: '2026-09-21T09:00:00',
    endsAt: '2026-09-21T09:30:00',
    status: status as AppointmentResponse['status'],
  };
}

function clickButton(fixture: ComponentFixture<AgendaStatusActions>, label: string): void {
  const buttons = Array.from(
    fixture.nativeElement.querySelectorAll('button'),
  ) as HTMLButtonElement[];
  const target = buttons.find((button) => button.textContent?.includes(label));
  expect(target).toBeTruthy();
  target?.click();
  fixture.detectChanges();
}

function paneText(): string {
  return document.querySelector('.cdk-overlay-pane')?.textContent ?? '';
}

function clickInPane(label: string): void {
  const buttons = Array.from(
    document.querySelectorAll('.cdk-overlay-pane button'),
  ) as HTMLButtonElement[];
  const target = buttons.find((button) => button.textContent?.includes(label));
  expect(target).toBeTruthy();
  target?.click();
}

describe('AgendaStatusActions', () => {
  let fixture: ComponentFixture<AgendaStatusActions>;
  let httpTesting: HttpTestingController;
  let toasts: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgendaStatusActions],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(AgendaStatusActions);
    httpTesting = TestBed.inject(HttpTestingController);
    toasts = TestBed.inject(ToastService);
  });

  afterEach(() => {
    httpTesting.verify();
    document.querySelectorAll('.cdk-overlay-container').forEach((element) => element.remove());
    document.documentElement.classList.remove('cdk-global-scrollblock');
  });

  it('should render only the valid transitions for a programada appointment', () => {
    fixture.componentRef.setInput('appointment', appointment('programada'));
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Confirmar');
    expect(text).toContain('Cancelar');
    expect(text).not.toContain('Marcar atendida');
    expect(text).not.toContain('No asistió');
  });

  it('should render all three actions for a confirmada appointment', () => {
    fixture.componentRef.setInput('appointment', appointment('confirmada'));
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Marcar atendida');
    expect(text).toContain('No asistió');
    expect(text).toContain('Cancelar');
    expect(text).not.toContain('Confirmar');
  });

  it('should show a final-state note with no actions for a terminal status', () => {
    for (const status of ['atendida', 'no_show', 'cancelada'] as const) {
      fixture.componentRef.setInput('appointment', appointment(status));
      fixture.detectChanges();
      const text = fixture.nativeElement.textContent as string;
      expect(text).toContain('Estado final');
      expect(fixture.nativeElement.querySelectorAll('button')).toHaveLength(0);
    }
  });

  it('should PATCH the status and toast on success', async () => {
    fixture.componentRef.setInput('appointment', appointment('programada'));
    fixture.detectChanges();
    clickButton(fixture, 'Confirmar');
    const request = httpTesting.expectOne((call) =>
      call.url.endsWith('/api/v1/appointments/appointment-1/status'),
    );
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'confirmada' });
    request.flush({ ...appointment('programada'), status: 'confirmada' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(toasts.toasts().map((toast) => toast.message)).toContain('Cita confirmada.');
    expect(fixture.componentInstance.pending()).toBeNull();
  });

  it('should require confirmation before canceling', () => {
    fixture.componentRef.setInput('appointment', appointment('programada'));
    fixture.detectChanges();
    clickButton(fixture, 'Cancelar');
    httpTesting.expectNone((call) => call.url.includes('/status'));
    expect(paneText()).toContain('Cancelar cita');
    expect(paneText()).toContain('no se puede deshacer');
  });

  it('should cancel after the confirmation step', async () => {
    fixture.componentRef.setInput('appointment', appointment('programada'));
    fixture.detectChanges();
    clickButton(fixture, 'Cancelar');
    vi.useFakeTimers();
    try {
      clickInPane('Sí, cancelar cita');
      fixture.detectChanges();
      vi.advanceTimersByTime(300);
    } finally {
      vi.useRealTimers();
    }
    fixture.detectChanges();
    const request = httpTesting.expectOne((call) =>
      call.url.endsWith('/api/v1/appointments/appointment-1/status'),
    );
    expect(request.request.body).toEqual({ status: 'cancelada' });
    request.flush({ ...appointment('programada'), status: 'cancelada' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(toasts.toasts().map((toast) => toast.message)).toContain('Cita cancelada.');
    expect(document.querySelector('.cdk-overlay-pane')).toBeNull();
  });

  it('should surface the backend message when a transition is rejected', async () => {
    fixture.componentRef.setInput('appointment', appointment('programada'));
    fixture.detectChanges();
    clickButton(fixture, 'Confirmar');
    const request = httpTesting.expectOne((call) => call.url.includes('/status'));
    request.flush(
      { message: "No se puede pasar de 'programada' a 'atendida'." },
      { status: 400, statusText: 'Bad Request' },
    );
    await fixture.whenStable();
    fixture.detectChanges();
    expect(toasts.toasts().map((toast) => toast.message)).toContain(
      "No se puede pasar de 'programada' a 'atendida'.",
    );
    expect(fixture.componentInstance.pending()).toBeNull();
  });

  it('should block a second transition while one is in flight', () => {
    fixture.componentRef.setInput('appointment', appointment('confirmada'));
    fixture.detectChanges();
    clickButton(fixture, 'Marcar atendida');
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const cancel = buttons.find((button) => button.textContent?.includes('Cancelar'));
    expect(cancel?.disabled).toBe(true);
    cancel?.click();
    fixture.detectChanges();
    const requests = httpTesting.match((call) => call.url.includes('/status'));
    expect(requests).toHaveLength(1);
    requests[0]?.flush({ ...appointment('confirmada'), status: 'atendida' });
  });
});
