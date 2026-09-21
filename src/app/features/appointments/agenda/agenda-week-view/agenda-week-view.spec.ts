import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgendaWeekView } from './agenda-week-view';

describe('AgendaWeekView', () => {
  let fixture: ComponentFixture<AgendaWeekView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgendaWeekView],
    }).compileComponents();
    fixture = TestBed.createComponent(AgendaWeekView);
    fixture.componentRef.setInput('columns', [
      {
        isoDate: '2026-09-21',
        label: 'Lunes 21 de septiembre',
        isToday: true,
        appointments: [
          {
            id: 'appointment-1',
            patientName: 'Ada Luz',
            startsAt: '2026-09-21T09:00:00',
            endsAt: '2026-09-21T09:30:00',
            status: 'programada',
          },
        ],
      },
      {
        isoDate: '2026-09-22',
        label: 'Martes 22 de septiembre',
        isToday: false,
        appointments: [],
      },
    ]);
    fixture.detectChanges();
  });

  it('should render one column per day with compact appointments', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Lunes 21 de septiembre');
    expect(text).toContain('Ada Luz');
    expect(text).toContain('Programada');
    expect(text).toContain('Martes 22 de septiembre');
    expect(text).toContain('Sin citas');
  });
});
