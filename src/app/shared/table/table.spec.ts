import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Icon } from '@shared/icon/icon';
import { IconButton } from '@shared/icon-button/icon-button';
import { Table } from './table';
import { TableExportService } from './table-export.service';
import {
  DateRange,
  NumberRange,
  TableColumn,
  TableQuery,
  TableRow,
  createInitialQuery,
} from './table-models';

const ALL_MEMBERS: ReadonlyArray<TableRow> = [
  { name: 'Ada', role: 'Dentist', status: 'active', joined: '2026-01-12', salary: 1200000 },
  { name: 'Marie', role: 'Dentist', status: 'on-leave', joined: '2025-11-03', salary: 1500000 },
  { name: 'Luis', role: 'Nurse', status: 'active', joined: '2026-02-20', salary: 800000 },
  { name: 'Ana', role: 'Reception', status: 'active', joined: '2024-06-15', salary: 900000 },
  { name: 'José', role: 'Nurse', status: 'inactive', joined: '2023-03-30', salary: 820000 },
  { name: 'Elena', role: 'Dentist', status: 'active', joined: '2026-01-05', salary: 1400000 },
];

@Component({
  imports: [Icon, IconButton, Table],
  template: `
    <app-table
      [columns]="columns"
      [rows]="pageRows"
      [total]="total"
      [loading]="loading()"
      [query]="query()"
      (queryChange)="onQuery($event)"
      [exportData]="exporter"
      exportFilename="team.xlsx"
      [rowActions]="rowActions"
    >
      <ng-template #rowActions let-row>
        <app-icon-button label="Edit member" (clicked)="onEdit(row)">
          <app-icon name="pencil" />
        </app-icon-button>
      </ng-template>
    </app-table>
  `,
})
class MembersHost {
  readonly columns: ReadonlyArray<TableColumn> = [
    { key: 'name', header: 'Name', sortable: true },
    {
      key: 'role',
      header: 'Role',
      filter: {
        kind: 'select',
        options: [
          { value: 'Dentist', label: 'Dentist' },
          { value: 'Nurse', label: 'Nurse' },
        ],
      },
    },
    {
      key: 'status',
      header: 'Status',
      type: 'status',
      statusTones: { active: 'success', 'on-leave': 'warning', inactive: 'danger' },
      filter: {
        kind: 'multi',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'on-leave', label: 'On leave' },
        ],
      },
    },
    { key: 'joined', header: 'Joined', type: 'date', filter: { kind: 'date' } },
    { key: 'salary', header: 'Salary', type: 'currency', filter: { kind: 'number' } },
  ];
  readonly query = signal<TableQuery>(createInitialQuery(2));
  readonly loading = signal(false);
  lastQuery: TableQuery | null = null;
  lastEdited: string | null = null;
  readonly exporter = vi.fn(async (): Promise<ReadonlyArray<TableRow>> => [...ALL_MEMBERS]);

  get filtered(): Array<TableRow> {
    const query = this.query();
    const search = (query.search ?? '').toLowerCase();
    const role = query.filters['role'];
    const statuses = query.filters['status'];
    const joined = query.filters['joined'];
    const salary = query.filters['salary'];
    const matching = ALL_MEMBERS.filter((row) => {
      if (search && !String(row['name']).toLowerCase().includes(search)) {
        return false;
      }
      if (typeof role === 'string' && role !== '' && row['role'] !== role) {
        return false;
      }
      if (
        Array.isArray(statuses) &&
        statuses.length > 0 &&
        !statuses.includes(String(row['status']))
      ) {
        return false;
      }
      if (joined !== undefined && !Array.isArray(joined) && typeof joined !== 'string') {
        const range = joined as DateRange;
        if (range.from && String(row['joined']) < range.from) {
          return false;
        }
        if (range.to && String(row['joined']) > range.to) {
          return false;
        }
      }
      if (salary !== undefined && !Array.isArray(salary) && typeof salary !== 'string') {
        const range = salary as NumberRange;
        if (range.min !== undefined && Number(row['salary']) < range.min) {
          return false;
        }
        if (range.max !== undefined && Number(row['salary']) > range.max) {
          return false;
        }
      }
      return true;
    });
    if (query.sortKey === 'name') {
      matching.sort((a, b) =>
        query.sortDir === 'desc'
          ? String(b['name']).localeCompare(String(a['name']))
          : String(a['name']).localeCompare(String(b['name'])),
      );
    }
    return matching;
  }

  get total(): number {
    return this.filtered.length;
  }

  get pageRows(): Array<TableRow> {
    const query = this.query();
    const start = (query.page - 1) * query.pageSize;
    return this.filtered.slice(start, start + query.pageSize);
  }

  onQuery(query: TableQuery): void {
    this.lastQuery = query;
    this.query.set(query);
  }

  onEdit(row: TableRow): void {
    this.lastEdited = String(row['name']);
  }
}

describe('Table', () => {
  let fixture: ComponentFixture<MembersHost>;

  const bodyText = (): string => fixture.nativeElement.textContent as string;
  const sortButton = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('th button') as HTMLButtonElement;

  function openFiltros(): void {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as Array<HTMLButtonElement>;
    buttons.find((button) => button.textContent?.includes('Filtros'))?.click();
    fixture.detectChanges();
  }

  function searchFor(value: string): void {
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    vi.advanceTimersByTime(300);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MembersHost],
      providers: [
        { provide: TableExportService, useValue: { exportToXlsx: vi.fn(async () => new Blob()) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(MembersHost);
    fixture.detectChanges();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render headers and the first page of rows', () => {
    expect(bodyText()).toContain('Name');
    expect(bodyText()).toContain('Ada');
    expect(bodyText()).toContain('Marie');
    expect(bodyText()).not.toContain('Luis');
  });

  it('should render rich cells with tones and formats', () => {
    expect(bodyText()).toContain('active');
    expect(bodyText()).toContain('2026');
    expect(bodyText()).toContain('1.200.000');
  });

  it('should emit sorting on header click', () => {
    sortButton().click();
    expect(fixture.componentInstance.lastQuery?.sortKey).toBe('name');
    expect(fixture.componentInstance.lastQuery?.sortDir).toBe('asc');
    fixture.detectChanges();
    sortButton().click();
    expect(fixture.componentInstance.lastQuery?.sortDir).toBe('desc');
  });

  it('should emit debounced search and reset to the first page', () => {
    searchFor('lui');
    expect(fixture.componentInstance.lastQuery?.search).toBe('lui');
    expect(fixture.componentInstance.lastQuery?.page).toBe(1);
    expect(bodyText()).toContain('Luis');
    expect(bodyText()).not.toContain('Ada');
  });

  it('should filter by select from the panel and show a chip', () => {
    openFiltros();
    const radios = Array.from(
      fixture.nativeElement.querySelectorAll('input[type="radio"]'),
    ) as Array<HTMLInputElement>;
    radios[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.lastQuery?.filters['role']).toBe('Dentist');
    expect(bodyText()).toContain('Role: Dentist');
  });

  it('should remove a filter through its chip', () => {
    openFiltros();
    const radios = Array.from(
      fixture.nativeElement.querySelectorAll('input[type="radio"]'),
    ) as Array<HTMLInputElement>;
    radios[0].click();
    fixture.detectChanges();
    const remove = fixture.nativeElement.querySelector(
      '[aria-label="Quitar filtro Role: Dentist"]',
    ) as HTMLButtonElement;
    remove.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.lastQuery?.filters['role']).toBeUndefined();
  });

  it('should not render chips without active filters', () => {
    expect(fixture.nativeElement.querySelector('[aria-label^="Quitar filtro"]')).toBeNull();
  });

  it('should render layout components as blocks for stacked layouts', () => {
    for (const selector of ['app-table-bar', 'app-table-grid', 'app-table-pagination']) {
      const element = fixture.nativeElement.querySelector(selector) as HTMLElement;
      expect(element.className).toContain('block');
    }
  });

  it('should filter by multiple statuses from the panel', () => {
    openFiltros();
    const boxes = Array.from(
      fixture.nativeElement.querySelectorAll('input[type="checkbox"]'),
    ) as Array<HTMLInputElement>;
    boxes[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.lastQuery?.filters['status']).toEqual(['active']);
  });

  it('should filter by date range from the panel', () => {
    openFiltros();
    const from = fixture.nativeElement.querySelector(
      '[aria-label="Joined desde"]',
    ) as HTMLInputElement;
    from.value = '2026-01-01';
    from.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.lastQuery?.filters['joined']).toEqual({
      from: '2026-01-01',
    });
  });

  it('should filter by salary minimum from the panel', () => {
    openFiltros();
    const min = fixture.nativeElement.querySelector(
      '[aria-label="Salary mínimo"]',
    ) as HTMLInputElement;
    min.value = '1000000';
    min.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.lastQuery?.filters['salary']).toEqual({ min: 1000000 });
  });

  it('should run row actions with their row', () => {
    const edit = fixture.nativeElement.querySelector(
      '[aria-label="Edit member"]',
    ) as HTMLButtonElement;
    edit.click();
    expect(fixture.componentInstance.lastEdited).toBe('Ada');
  });

  it('should show skeleton rows matching the table shape while loading', () => {
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    const skeletons = fixture.nativeElement.querySelectorAll('.skeleton');
    expect(skeletons.length).toBe(2 * (5 + 1));
    expect(bodyText()).not.toContain('Ada');
  });

  it('should show the empty state with no rows', () => {
    searchFor('zzz-no-match');
    expect(bodyText()).toContain('No hay resultados');
  });

  it('should emit page changes from pagination', () => {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('nav button'),
    ) as Array<HTMLButtonElement>;
    buttons.find((button) => button.textContent?.includes('Siguiente'))?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.lastQuery?.page).toBe(2);
    expect(bodyText()).toContain('Luis');
  });

  it('should export through the parent provider and the export service', async () => {
    const service = TestBed.inject(TableExportService);
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as Array<HTMLButtonElement>;
    buttons.find((button) => button.textContent?.includes('Export'))?.click();
    await vi.advanceTimersByTimeAsync(10);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    expect(host.exporter).toHaveBeenCalled();
    expect(service.exportToXlsx).toHaveBeenCalledWith(host.columns, [...ALL_MEMBERS], 'team.xlsx');
  });
});
