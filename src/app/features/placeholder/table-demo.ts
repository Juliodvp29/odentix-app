import { Component, computed, inject, signal } from '@angular/core';
import { IconButton } from '@shared/icon-button/icon-button';
import { Table } from '@shared/table/table';
import {
  DateRange,
  NumberRange,
  TableColumn,
  TableQuery,
  TableRow,
  createInitialQuery,
} from '@shared/table/table-models';
import { ToastService } from '@shared/toast/toast.service';

// Temporary rich table demo. Removed once the first real feature lands.
@Component({
  selector: 'app-table-demo',
  imports: [IconButton, Table],
  template: `
    <section class="space-y-16">
      <h2 class="text-heading-sm text-ink">Table</h2>
      <app-table
        [columns]="columns"
        [rows]="pageRows()"
        [total]="total()"
        [query]="query()"
        (queryChange)="onQuery($event)"
        [exportData]="exporter"
        exportFilename="demo-team.xlsx"
        [rowActions]="rowActions"
      >
        <ng-template #rowActions let-row>
          <app-icon-button label="Edit member" (clicked)="edit(row)">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              aria-hidden="true"
            >
              <path d="M11 2l3 3L5 14H2v-3l9-9z" stroke-linejoin="round" />
            </svg>
          </app-icon-button>
          <app-icon-button label="Delete member" (clicked)="remove(row)">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              aria-hidden="true"
            >
              <path
                d="M3 4h10M6.5 4V3h3v1M5 4l.8 9h4.4L11 4"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </app-icon-button>
        </ng-template>
      </app-table>
    </section>
  `,
})
export class TableDemo {
  private readonly notifications = inject(ToastService);

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
          { value: 'Reception', label: 'Reception' },
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
          { value: 'inactive', label: 'Inactive' },
        ],
      },
    },
    { key: 'joined', header: 'Joined', type: 'date', filter: { kind: 'date' } },
    { key: 'salary', header: 'Salary', type: 'currency', filter: { kind: 'number' } },
  ];
  readonly query = signal<TableQuery>(createInitialQuery(5));
  readonly members: ReadonlyArray<TableRow> = [
    { name: 'Ada', role: 'Dentist', status: 'active', joined: '2026-01-12', salary: 1200000 },
    { name: 'Marie', role: 'Dentist', status: 'on-leave', joined: '2025-11-03', salary: 1500000 },
    { name: 'Luis', role: 'Nurse', status: 'active', joined: '2026-02-20', salary: 800000 },
    { name: 'Ana', role: 'Reception', status: 'active', joined: '2024-06-15', salary: 900000 },
    { name: 'José', role: 'Nurse', status: 'inactive', joined: '2023-03-30', salary: 820000 },
    { name: 'Elena', role: 'Dentist', status: 'active', joined: '2026-01-05', salary: 1400000 },
  ];

  readonly filtered = computed(() => {
    const query = this.query();
    const search = (query.search ?? '').toLowerCase();
    return this.members
      .filter((row) => {
        if (search && !String(row['name']).toLowerCase().includes(search)) {
          return false;
        }
        const role = query.filters['role'];
        if (typeof role === 'string' && role !== '' && row['role'] !== role) {
          return false;
        }
        const statuses = query.filters['status'];
        if (
          Array.isArray(statuses) &&
          statuses.length > 0 &&
          !statuses.includes(String(row['status']))
        ) {
          return false;
        }
        const joined = query.filters['joined'];
        if (joined !== undefined && typeof joined === 'object' && !Array.isArray(joined)) {
          const range = joined as DateRange;
          if (range.from && String(row['joined']) < range.from) {
            return false;
          }
          if (range.to && String(row['joined']) > range.to) {
            return false;
          }
        }
        const salary = query.filters['salary'];
        if (salary !== undefined && typeof salary === 'object' && !Array.isArray(salary)) {
          const range = salary as NumberRange;
          if (range.min !== undefined && Number(row['salary']) < range.min) {
            return false;
          }
          if (range.max !== undefined && Number(row['salary']) > range.max) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (query.sortKey !== 'name') {
          return 0;
        }
        const comparison = String(a['name']).localeCompare(String(b['name']));
        return query.sortDir === 'desc' ? -comparison : comparison;
      });
  });
  readonly total = computed(() => this.filtered().length);
  readonly pageRows = computed(() => {
    const query = this.query();
    const start = (query.page - 1) * query.pageSize;
    return this.filtered().slice(start, start + query.pageSize);
  });

  onQuery(query: TableQuery): void {
    this.query.set(query);
  }

  edit(row: TableRow): void {
    this.notifications.info(`Editing ${String(row['name'])}`);
  }

  remove(row: TableRow): void {
    this.notifications.success(`Removed ${String(row['name'])}`);
  }

  readonly exporter = async (): Promise<ReadonlyArray<TableRow>> => [...this.members];
}
