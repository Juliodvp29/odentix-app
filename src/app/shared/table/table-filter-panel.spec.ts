import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableFilterPanel } from './table-filter-panel';
import { FilterValue, TableColumn } from './table-models';

const COLUMNS: ReadonlyArray<TableColumn> = [
  {
    key: 'role',
    header: 'Role',
    filter: {
      kind: 'select',
      options: [
        { value: 'dentist', label: 'Dentist' },
        { value: 'nurse', label: 'Nurse' },
      ],
    },
  },
  {
    key: 'tags',
    header: 'Tags',
    filter: {
      kind: 'multi',
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
    },
  },
  { key: 'joined', header: 'Joined', filter: { kind: 'date' } },
  { key: 'salary', header: 'Salary', filter: { kind: 'number' } },
];

describe('TableFilterPanel', () => {
  let fixture: ComponentFixture<TableFilterPanel>;
  let emitted: Array<{ key: string; value: FilterValue }>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableFilterPanel],
    }).compileComponents();
    fixture = TestBed.createComponent(TableFilterPanel);
    fixture.componentRef.setInput('columns', COLUMNS);
    emitted = [];
    fixture.componentInstance.filterChanged.subscribe((event) => emitted.push(event));
    fixture.detectChanges();
  });

  it('should emit a select filter on radio change', () => {
    const radios = Array.from(
      fixture.nativeElement.querySelectorAll('input[type="radio"]'),
    ) as Array<HTMLInputElement>;
    radios[1].click();
    expect(emitted).toEqual([{ key: 'role', value: 'nurse' }]);
  });

  it('should toggle multi options in and out', () => {
    const boxes = Array.from(
      fixture.nativeElement.querySelectorAll('input[type="checkbox"]'),
    ) as Array<HTMLInputElement>;
    boxes[0].click();
    expect(emitted).toEqual([{ key: 'tags', value: ['a'] }]);
    fixture.componentRef.setInput('filters', { tags: ['a'] });
    fixture.detectChanges();
    boxes[0].click();
    expect(emitted[1]).toEqual({ key: 'tags', value: [] });
  });

  it('should emit a date range', () => {
    const from = fixture.nativeElement.querySelector(
      '[aria-label="Joined desde"]',
    ) as HTMLInputElement;
    from.value = '2026-01-01';
    from.dispatchEvent(new Event('change', { bubbles: true }));
    expect(emitted).toEqual([{ key: 'joined', value: { from: '2026-01-01' } }]);
  });

  it('should emit a number range', () => {
    const min = fixture.nativeElement.querySelector(
      '[aria-label="Salary mínimo"]',
    ) as HTMLInputElement;
    min.value = '100';
    min.dispatchEvent(new Event('change', { bubbles: true }));
    expect(emitted).toEqual([{ key: 'salary', value: { min: 100 } }]);
  });

  it('should emit clearRequested', () => {
    let cleared = 0;
    fixture.componentInstance.clearRequested.subscribe(() => cleared++);
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as Array<HTMLButtonElement>;
    buttons.find((button) => button.textContent?.includes('Limpiar todo'))?.click();
    expect(cleared).toBe(1);
  });
});
