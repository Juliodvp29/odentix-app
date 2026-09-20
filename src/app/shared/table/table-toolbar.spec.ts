import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableToolbar } from './table-toolbar';

describe('TableToolbar', () => {
  let fixture: ComponentFixture<TableToolbar>;

  const searchInput = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;

  function typeSearch(value: string): void {
    const input = searchInput();
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableToolbar],
    }).compileComponents();
    fixture = TestBed.createComponent(TableToolbar);
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

  it('should hide the export button without an export provider', () => {
    expect(fixture.nativeElement.textContent).not.toContain('Export');
  });

  it('should emit exportRequested when export is clicked', () => {
    let emitted = 0;
    fixture.componentInstance.exportRequested.subscribe(() => emitted++);
    fixture.componentRef.setInput('canExport', true);
    fixture.detectChanges();
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    buttons.find((button) => button.textContent?.includes('Export'))?.click();
    expect(emitted).toBe(1);
  });

  it('should emit clearRequested when clear is clicked', () => {
    let emitted = 0;
    fixture.componentInstance.clearRequested.subscribe(() => emitted++);
    fixture.componentRef.setInput('hasActiveFilters', true);
    fixture.detectChanges();
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    buttons.find((button) => button.textContent?.includes('Clear'))?.click();
    expect(emitted).toBe(1);
  });
});
