import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AgendaLegendEntry, AgendaSidebar } from './agenda-sidebar';

const LEGEND: AgendaLegendEntry[] = [
  {
    status: 'programada',
    label: 'Programada',
    badge: 'bg-info-soft text-info-deep',
    dot: 'bg-info',
  },
  {
    status: 'confirmada',
    label: 'Confirmada',
    badge: 'bg-teal-soft text-teal-deep',
    dot: 'bg-teal',
  },
];

describe('AgendaSidebar', () => {
  let fixture: ComponentFixture<AgendaSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgendaSidebar],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(AgendaSidebar);
    fixture.componentRef.setInput('anchorIsoDate', '2026-09-21');
    fixture.componentRef.setInput('legend', LEGEND);
    fixture.detectChanges();
  });

  it('should render the mini calendar, detail prompt, and legend', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Septiembre');
    expect(text).toContain('Selecciona una cita');
    expect(text).toContain('CONVENCIÓN DE ESTADOS');
    expect(text).toContain('Programada');
    expect(text).toContain('Confirmada');
  });

  it('should forward month navigation and day picks', () => {
    let previous = 0;
    let next = 0;
    let picked: string | null = null;
    fixture.componentInstance.previousMonth.subscribe(() => (previous += 1));
    fixture.componentInstance.nextMonth.subscribe(() => (next += 1));
    fixture.componentInstance.dayPicked.subscribe((day) => (picked = day));
    (
      fixture.nativeElement.querySelector('button[aria-label="Mes anterior"]') as HTMLButtonElement
    ).click();
    (
      fixture.nativeElement.querySelector('button[aria-label="Mes siguiente"]') as HTMLButtonElement
    ).click();
    (fixture.nativeElement.querySelector('button[aria-label="21"]') as HTMLButtonElement).click();
    expect(previous).toBe(1);
    expect(next).toBe(1);
    expect(picked).toBe('2026-09-21');
  });

  it('should forward the detail panel close', () => {
    let closed = false;
    fixture.componentInstance.closed.subscribe(() => (closed = true));
    fixture.componentRef.setInput('selectedAppointment', { id: 'appointment-1' });
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector(
        'button[aria-label="Cerrar detalle"]',
      ) as HTMLButtonElement
    ).click();
    expect(closed).toBe(true);
  });

  it('should hide the legend card when there are no entries', () => {
    fixture.componentRef.setInput('legend', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('CONVENCIÓN DE ESTADOS');
  });
});
