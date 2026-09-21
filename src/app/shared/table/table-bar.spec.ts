import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableBar } from './table-bar';

describe('TableBar', () => {
  let fixture: ComponentFixture<TableBar>;

  function typeSearch(value: string): void {
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableBar],
    }).compileComponents();
    fixture = TestBed.createComponent(TableBar);
    fixture.detectChanges();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should emit the search value debounced', () => {
    let emitted = '';
    fixture.componentInstance.searchChange.subscribe((value) => (emitted = value));
    typeSearch('ada');
    expect(emitted).toBe('');
    vi.advanceTimersByTime(300);
    expect(emitted).toBe('ada');
  });

  it('should show the active filter count and toggle the panel', () => {
    let toggled = 0;
    fixture.componentInstance.filtersToggle.subscribe(() => toggled++);
    fixture.componentRef.setInput('hasFilters', true);
    fixture.componentRef.setInput('activeFilterCount', 2);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('2');
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as Array<HTMLButtonElement>;
    buttons.find((button) => button.textContent?.includes('Filters'))?.click();
    expect(toggled).toBe(1);
  });

  it('should hide the filters button without filterable columns', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Filters');
  });

  it('should emit exportRequested when export is clicked', () => {
    let emitted = 0;
    fixture.componentInstance.exportRequested.subscribe(() => emitted++);
    fixture.componentRef.setInput('canExport', true);
    fixture.detectChanges();
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as Array<HTMLButtonElement>;
    buttons.find((button) => button.textContent?.includes('Export'))?.click();
    expect(emitted).toBe(1);
  });
});
