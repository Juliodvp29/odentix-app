import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CellDef } from './cell-def';
import { Table } from './table';
import { TableExportService } from './table-export.service';
import { TableColumn, TableQuery, TableRow, createInitialQuery } from './table-models';

const ALL_MEMBERS: ReadonlyArray<TableRow> = [
  { name: 'Ada', role: 'Dentist' },
  { name: 'Marie', role: 'Dentist' },
  { name: 'Luis', role: 'Nurse' },
  { name: 'Ana', role: 'Reception' },
  { name: 'José', role: 'Nurse' },
];

@Component({
  imports: [CellDef, Table],
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
    >
      <ng-template appCell="role" let-row>
        <span class="badge">{{ row.role }}</span>
      </ng-template>
    </app-table>
  `,
})
class MembersHost {
  readonly columns: ReadonlyArray<TableColumn> = [
    { key: 'name', header: 'Name', sortable: true, filterable: true },
    {
      key: 'role',
      header: 'Role',
      filterable: true,
      filterOptions: [
        { value: 'Dentist', label: 'Dentist' },
        { value: 'Nurse', label: 'Nurse' },
      ],
    },
  ];
  readonly query = signal<TableQuery>(createInitialQuery(2));
  readonly loading = signal(false);
  lastQuery: TableQuery | null = null;
  readonly exporter = vi.fn(async (): Promise<ReadonlyArray<TableRow>> => [...ALL_MEMBERS]);

  get filtered(): Array<TableRow> {
    const query = this.query();
    const search = (query.search ?? '').toLowerCase();
    const role = query.filters['role'] ?? '';
    const matching = ALL_MEMBERS.filter(
      (row) =>
        (!search || String(row['name']).toLowerCase().includes(search)) &&
        (!role || row['role'] === role),
    );
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
}

describe('Table', () => {
  let fixture: ComponentFixture<MembersHost>;

  const bodyText = (): string => fixture.nativeElement.textContent as string;
  const sortButton = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('th button') as HTMLButtonElement;

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

  it('should render custom cell templates', () => {
    const badge = fixture.nativeElement.querySelector('.badge') as HTMLElement;
    expect(badge?.textContent).toBe('Dentist');
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

  it('should emit column filters and reset to the first page', () => {
    const select = fixture.nativeElement.querySelector('td select') as HTMLSelectElement;
    select.value = 'Nurse';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.lastQuery?.filters['role']).toBe('Nurse');
    expect(fixture.componentInstance.lastQuery?.page).toBe(1);
    expect(bodyText()).toContain('Luis');
    expect(bodyText()).not.toContain('Ada');
  });

  it('should show skeleton rows matching the table shape while loading', () => {
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    const skeletons = fixture.nativeElement.querySelectorAll('.skeleton');
    expect(skeletons.length).toBe(2 * 2);
    expect(bodyText()).not.toContain('Ada');
  });

  it('should show the empty state with no rows', () => {
    searchFor('zzz-no-match');
    expect(bodyText()).toContain('No results found');
  });

  it('should emit page changes from pagination', () => {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('nav button'),
    ) as Array<HTMLButtonElement>;
    buttons.find((button) => button.textContent?.includes('Next'))?.click();
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
