import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AgendaDetailPanel } from './agenda-detail-panel';

describe('AgendaDetailPanel', () => {
  let fixture: ComponentFixture<AgendaDetailPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgendaDetailPanel],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(AgendaDetailPanel);
    fixture.detectChanges();
  });

  it('should prompt without a selection', () => {
    expect(fixture.nativeElement.textContent).toContain('Selecciona una cita');
  });

  it('should render the appointment detail', () => {
    fixture.componentRef.setInput('appointment', {
      id: 'appointment-1',
      patientId: 'patient-1',
      patientName: 'Ada Luz',
      professionalName: 'Dra. Ríos',
      roomName: 'Box 1',
      startsAt: '2026-09-21T09:00:00',
      endsAt: '2026-09-21T09:30:00',
      status: 'confirmada',
      notes: 'Traer radiografía',
    });
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Ada Luz');
    expect(text).toContain('AL');
    expect(text).toContain('Dra. Ríos');
    expect(text).toContain('Box 1');
    expect(text).toContain('Confirmada');
    expect(text).toContain('Traer radiografía');
    expect(text).toContain('Ficha clínica');
  });

  it('should render avatar initials', () => {
    fixture.componentRef.setInput('appointment', {
      id: 'appointment-1',
      patientName: 'Ana García',
      status: 'programada',
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('AG');
  });

  it('should emit closed when the × button is clicked', () => {
    let closed = false;
    fixture.componentInstance.closed.subscribe(() => (closed = true));
    fixture.componentRef.setInput('appointment', { id: 'appointment-1' });
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      'button[aria-label="Cerrar detalle"]',
    ) as HTMLButtonElement;
    button.click();
    expect(closed).toBe(true);
  });
});
