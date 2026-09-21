import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgendaTimeGrid } from './agenda-time-grid';

const COLUMNS = [
  {
    professionalId: 'professional-1',
    professionalName: 'Dra. Ríos',
    appointments: [
      {
        id: 'appointment-1',
        patientName: 'Ada Luz',
        startsAt: '2026-09-21T09:00:00',
        endsAt: '2026-09-21T09:30:00',
        status: 'confirmada',
      },
      {
        id: 'appointment-2',
        patientName: 'Luis Pérez',
        startsAt: '2026-09-21T09:15:00',
        endsAt: '2026-09-21T09:45:00',
        status: 'programada',
      },
    ],
  },
];

describe('AgendaTimeGrid', () => {
  let fixture: ComponentFixture<AgendaTimeGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgendaTimeGrid],
    }).compileComponents();
    fixture = TestBed.createComponent(AgendaTimeGrid);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();
  });

  it('should render professional columns with positioned appointments', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Dra. Ríos');
    expect(text).toContain('Ada Luz');
    expect(text).toContain('Luis Pérez');
    expect(text).toContain('Confirmada');
    const blocks = fixture.nativeElement.querySelectorAll('button[style*="top"]');
    expect(blocks.length).toBe(2);
    const first = blocks[0] as HTMLElement;
    const second = blocks[1] as HTMLElement;
    expect(first.style.top).toBe('128px');
    expect(first.style.width).toContain('50');
    expect(second.style.left).toContain('50');
  });

  it('should emit the appointment on block click', () => {
    const emitted: unknown[] = [];
    fixture.componentInstance.appointmentPicked.subscribe((appointment) =>
      emitted.push(appointment),
    );
    const blocks = fixture.nativeElement.querySelectorAll('button[style*="top"]');
    (blocks[0] as HTMLButtonElement).click();
    expect(emitted).toEqual([
      expect.objectContaining({ id: 'appointment-1', patientName: 'Ada Luz' }),
    ]);
  });

  it('should emit free slot creation on empty space click', () => {
    let requested = false;
    fixture.componentInstance.freeSlotPicked.subscribe(() => (requested = true));
    const free = fixture.nativeElement.querySelector(
      'button[aria-label="Agendar en este espacio libre"]',
    ) as HTMLButtonElement;
    free.click();
    expect(requested).toBe(true);
  });
});
