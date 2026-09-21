import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgendaMonthView } from './agenda-month-view';

describe('AgendaMonthView', () => {
  let fixture: ComponentFixture<AgendaMonthView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgendaMonthView],
    }).compileComponents();
    fixture = TestBed.createComponent(AgendaMonthView);
    const days = Array.from({ length: 42 }, (_, index) => ({
      cell: {
        isoDate: `2026-09-${String(index + 1).padStart(2, '0')}`,
        dayNumber: index + 1,
        inMonth: true,
      },
      appointments:
        index === 20
          ? [
              { id: 'appointment-1', patientName: 'Ada Luz' },
              { id: 'appointment-2', patientName: 'Luis Pérez' },
              { id: 'appointment-3', patientName: 'Mía Díaz' },
              { id: 'appointment-4', patientName: 'Leo Ruiz' },
            ]
          : [],
      isToday: index === 20,
      isSelected: index === 20,
    }));
    fixture.componentRef.setInput('days', days);
    fixture.detectChanges();
  });

  it('should render the month grid with counts and status dots', () => {
    const cells = fixture.nativeElement.querySelectorAll('[role="gridcell"]');
    expect(cells.length).toBe(42);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('4 citas');
    // Patient names are no longer shown — cells display status-dot counts instead.
    // Verify that status dot spans render inside the active cell.
    const activeCell = Array.from(cells as NodeListOf<HTMLElement>).find((cell) =>
      cell.getAttribute('aria-label')?.startsWith('21,'),
    );
    expect(activeCell).not.toBeUndefined();
    const dots = activeCell?.querySelectorAll('.rounded-pill');
    expect(dots?.length).toBeGreaterThan(0);
  });

  it('should emit the picked day', () => {
    const emitted: string[] = [];
    fixture.componentInstance.dayPicked.subscribe((isoDate) => emitted.push(isoDate));
    const cells = fixture.nativeElement.querySelectorAll(
      '[role="gridcell"]',
    ) as NodeListOf<HTMLButtonElement>;
    cells[21]?.click();
    expect(emitted).toEqual(['2026-09-22']);
  });
});
