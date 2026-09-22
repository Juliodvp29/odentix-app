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

  it('should emit appointmentPicked when an appointment is clicked', () => {
    let pickedId: string | undefined;
    fixture.componentInstance.appointmentPicked.subscribe((appointment) => {
      pickedId = appointment.id;
    });
    const button = Array.from(fixture.nativeElement.querySelectorAll('button')).find((element) =>
      (element as HTMLButtonElement).textContent?.includes('Ada Luz'),
    ) as HTMLButtonElement;
    expect(button).toBeTruthy();
    button.click();
    expect(pickedId).toBe('appointment-1');
  });

  it('should expose appointments as keyboard-focusable buttons', () => {
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')).filter((element) =>
      (element as HTMLButtonElement).textContent?.includes('Ada Luz'),
    ) as HTMLButtonElement[];
    expect(buttons).toHaveLength(1);
    expect(buttons[0]?.type).toBe('button');
  });
});
