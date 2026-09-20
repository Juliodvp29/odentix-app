import { Component, computed, inject, signal, TemplateRef, viewChild } from '@angular/core';
import { email, form, required, submit } from '@angular/forms/signals';
import { Button } from '@shared/button/button';
import { FormField } from '@shared/form-field/form-field';
import { IconButton } from '@shared/icon-button/icon-button';
import { Link } from '@shared/link/link';
import { ModalService } from '@shared/modal/modal.service';
import { Select } from '@shared/select/select';
import { Skeleton } from '@shared/skeleton/skeleton';
import { Table } from '@shared/table/table';
import { CellDef } from '@shared/table/cell-def';
import { TableColumn, TableQuery, TableRow, createInitialQuery } from '@shared/table/table-models';
import { TextInput } from '@shared/text-input/text-input';
import { ToastService } from '@shared/toast/toast.service';
import { Toasts } from '@shared/toast/toasts';

// Temporary kit preview to judge the shared components visually.
// Removed once the first real feature lands.
@Component({
  selector: 'app-placeholder',
  imports: [
    Button,
    CellDef,
    FormField,
    IconButton,
    Link,
    Select,
    Skeleton,
    Table,
    TextInput,
    Toasts,
  ],
  template: `
    <div class="space-y-24 p-24">
      <section class="space-y-16">
        <h2 class="text-heading-sm text-ink">Buttons</h2>
        <div class="flex flex-wrap gap-8">
          <app-button (clicked)="openDemo()">Primary</app-button>
          <app-button variant="secondary">Secondary</app-button>
          <app-button variant="ghost">Ghost</app-button>
          <app-button variant="danger">Danger</app-button>
          <app-button [disabled]="true">Disabled</app-button>
          <app-button [loading]="true">Loading</app-button>
        </div>
        <div class="flex items-center gap-8">
          <app-icon-button label="Close dialog">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              aria-hidden="true"
            >
              <path d="M4 4l8 8M12 4l-8 8" stroke-linecap="round" />
            </svg>
          </app-icon-button>
          <app-link href="/placeholder">Internal link</app-link>
          <app-link href="https://angular.dev" [external]="true">External link</app-link>
        </div>
      </section>

      <section class="space-y-16">
        <h2 class="text-heading-sm text-ink">Form</h2>
        <form
          style="max-width: var(--content-max-width)"
          class="space-y-16"
          (submit)="submitDemo(); $event.preventDefault()"
        >
          <app-form-field label="Email" [field]="demoForm.email">
            <app-text-input [field]="demoForm.email" type="email" placeholder="you@example.com" />
          </app-form-field>
          <app-form-field label="Country" [field]="demoForm.country">
            <app-select [field]="demoForm.country">
              <option value="">Choose a country</option>
              <option value="co">Colombia</option>
            </app-select>
          </app-form-field>
          <app-button type="submit">Submit</app-button>
        </form>
      </section>

      <section class="space-y-16">
        <h2 class="text-heading-sm text-ink">Modal</h2>
        <app-button (clicked)="openDemo()">Open demo modal</app-button>
        <ng-template #demo>
          <p>Demo modal body to judge the enter/exit transitions.</p>
        </ng-template>
      </section>

      <section class="space-y-16">
        <h2 class="text-heading-sm text-ink">Toasts</h2>
        <div class="flex flex-wrap gap-8">
          <app-button variant="secondary" (clicked)="toast('success')">Success</app-button>
          <app-button variant="secondary" (clicked)="toast('error')">Error</app-button>
          <app-button variant="secondary" (clicked)="toast('info')">Info</app-button>
          <app-button variant="secondary" (clicked)="toast('warning')">Warning</app-button>
        </div>
      </section>
      <section class="space-y-16">
        <h2 class="text-heading-sm text-ink">Skeletons</h2>
        <div class="flex items-center gap-16">
          <app-skeleton variant="circle" />
          <div class="flex-1 space-y-8">
            <app-skeleton variant="line" />
            <div class="w-2/3">
              <app-skeleton variant="line" />
            </div>
          </div>
        </div>
        <div class="h-64">
          <app-skeleton variant="block" />
        </div>
      </section>
      <section class="space-y-16">
        <h2 class="text-heading-sm text-ink">Table</h2>
        <app-table
          [columns]="tableColumns"
          [rows]="tableRows()"
          [total]="tableTotal()"
          [query]="tableQuery()"
          (queryChange)="onTableQuery($event)"
          [exportData]="exportMembers"
          exportFilename="demo-team.xlsx"
        >
          <ng-template appCell="role" let-row>
            <span>{{ row.role }}</span>
          </ng-template>
        </app-table>
      </section>
    </div>
    <app-toasts />
  `,
})
export class Placeholder {
  private readonly modals = inject(ModalService);
  private readonly notifications = inject(ToastService);
  private readonly demo = viewChild('demo', { read: TemplateRef });

  readonly model = signal({ email: '', country: '' });
  readonly demoForm = form(this.model, (s) => {
    required(s.email, { message: 'Email is required' });
    email(s.email, { message: 'Enter a valid email address' });
    required(s.country, { message: 'Country is required' });
  });

  openDemo(): void {
    const template = this.demo();
    if (template) {
      this.modals.open(template, { title: 'Demo modal' });
    }
  }

  submitDemo(): void {
    submit(this.demoForm, async () => {});
  }

  toast(type: 'success' | 'error' | 'info' | 'warning'): void {
    this.notifications.show(`Demo ${type} toast`, type);
  }

  readonly tableColumns: ReadonlyArray<TableColumn> = [
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
  readonly tableQuery = signal<TableQuery>(createInitialQuery(5));
  readonly members: ReadonlyArray<TableRow> = [
    { name: 'Ada', role: 'Dentist' },
    { name: 'Marie', role: 'Dentist' },
    { name: 'Luis', role: 'Nurse' },
    { name: 'Ana', role: 'Reception' },
    { name: 'José', role: 'Nurse' },
    { name: 'Elena', role: 'Dentist' },
  ];

  readonly tableFiltered = computed(() => {
    const query = this.tableQuery();
    const search = (query.search ?? '').toLowerCase();
    const role = query.filters['role'] ?? '';
    const matching = this.members.filter(
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
  });
  readonly tableTotal = computed(() => this.tableFiltered().length);
  readonly tableRows = computed(() => {
    const query = this.tableQuery();
    const start = (query.page - 1) * query.pageSize;
    return this.tableFiltered().slice(start, start + query.pageSize);
  });

  onTableQuery(query: TableQuery): void {
    this.tableQuery.set(query);
  }

  readonly exportMembers = async (): Promise<ReadonlyArray<TableRow>> => [...this.members];
}
