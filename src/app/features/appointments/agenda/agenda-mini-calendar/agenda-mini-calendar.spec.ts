import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgendaMiniCalendar } from './agenda-mini-calendar';

describe('AgendaMiniCalendar', () => {
  let fixture: ComponentFixture<AgendaMiniCalendar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgendaMiniCalendar],
    }).compileComponents();
    fixture = TestBed.createComponent(AgendaMiniCalendar);
    fixture.componentRef.setInput('anchorIsoDate', '2026-09-21');
    fixture.componentRef.setInput('selectedIsoDate', '2026-09-21');
    fixture.detectChanges();
  });

  it('should render the month title and day cells', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Septiembre');
    const buttons = fixture.nativeElement.querySelectorAll('button[aria-pressed]');
    expect(buttons.length).toBe(42);
  });

  it('should emit navigation and picked days', () => {
    const picked: string[] = [];
    let previous = 0;
    let next = 0;
    fixture.componentInstance.dayPicked.subscribe((isoDate) => picked.push(isoDate));
    fixture.componentInstance.previousMonth.subscribe(() => (previous += 1));
    fixture.componentInstance.nextMonth.subscribe(() => (next += 1));
    const days = fixture.nativeElement.querySelectorAll('button[aria-pressed]');
    (days[22] as HTMLButtonElement).click();
    expect(picked).toEqual(['2026-09-22']);
    (
      fixture.nativeElement.querySelector('[aria-label="Mes anterior"]') as HTMLButtonElement
    ).click();
    (
      fixture.nativeElement.querySelector('[aria-label="Mes siguiente"]') as HTMLButtonElement
    ).click();
    expect(previous).toBe(1);
    expect(next).toBe(1);
  });
});
