import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgendaDayView } from './agenda-day-view';

describe('AgendaDayView', () => {
  let fixture: ComponentFixture<AgendaDayView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgendaDayView],
    }).compileComponents();
    fixture = TestBed.createComponent(AgendaDayView);
    fixture.componentRef.setInput('appointments', [
      {
        id: 'appointment-1',
        patientName: 'Ada Luz',
        professionalName: 'Dra. Ríos',
        startsAt: '2026-09-21T09:00:00',
        endsAt: '2026-09-21T09:30:00',
        status: 'confirmada',
      },
      {
        id: 'appointment-2',
        patientName: 'Luis Pérez',
        startsAt: '2026-09-21T10:00:00',
        endsAt: '2026-09-21T10:30:00',
        status: 'no_show',
      },
    ]);
    fixture.detectChanges();
  });

  it('should render appointments in order with times and status labels', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Ada Luz');
    expect(text).toContain('Dra. Ríos');
    expect(text).toContain('Confirmada');
    expect(text).toContain('Luis Pérez');
    expect(text).toContain('No asistió');
    expect(text.indexOf('Ada Luz')).toBeLessThan(text.indexOf('Luis Pérez'));
  });
});
