import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  TemplateRef,
  computed,
  contentChildren,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Skeleton } from '@shared/skeleton/skeleton';
import { CellDef } from './cell-def';
import { TableExportService } from './table-export.service';
import {
  ExportDataProvider,
  SortDirection,
  TableColumn,
  TableQuery,
  TableRow,
  resolveCellValue,
} from './table-models';
import { TableHeader } from './table-header';
import { TablePagination } from './table-pagination';
import { TableToolbar } from './table-toolbar';

@Component({
  selector: 'app-table',
  imports: [NgTemplateOutlet, Skeleton, TableHeader, TableToolbar, TablePagination],
  template: `
    <div class="space-y-16">
      <app-table-toolbar
        [search]="query().search ?? ''"
        [canExport]="exportData() !== undefined"
        [exporting]="exporting()"
        [hasActiveFilters]="hasActiveFilters()"
        (searchChange)="onSearch($event)"
        (exportRequested)="onExport()"
        (clearRequested)="onClear()"
      />
      <div class="overflow-x-auto rounded-card bg-paper shadow-resting">
        <table class="w-full border-collapse text-left" [attr.aria-busy]="loading()">
          <thead
            appTableHeader
            [columns]="columns()"
            [sortKey]="query().sortKey"
            [sortDir]="query().sortDir"
            [filters]="query().filters"
            (sortRequested)="onSortRequested($event)"
            (filterChanged)="onFilter($event.key, $event.value)"
          ></thead>
          <tbody>
            @if (loading()) {
              @for (row of skeletonRows(); track row) {
                <tr>
                  @for (column of columns(); track column.key) {
                    <td class="border-b border-hairline px-16 py-12">
                      <app-skeleton variant="line" />
                    </td>
                  }
                </tr>
              }
            } @else if (rows().length === 0) {
              <tr>
                <td [attr.colspan]="columns().length" class="px-16 py-32 text-center">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    aria-hidden="true"
                    class="mx-auto mb-8 h-24 w-24 text-faint-gray"
                  >
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M3 9h18M9 9v11" />
                  </svg>
                  <p class="text-body text-mid-gray">{{ emptyMessage() }}</p>
                </td>
              </tr>
            } @else {
              @for (row of rows(); track $index) {
                <tr class="transition-colors duration-fast hover:bg-surface-alt">
                  @for (column of columns(); track column.key) {
                    <td class="border-b border-hairline px-16 py-12 text-body text-ink">
                      @if (cellTemplate(column.key); as template) {
                        <ng-container *ngTemplateOutlet="template; context: { $implicit: row }" />
                      } @else {
                        {{ cellText(column, row) }}
                      }
                    </td>
                  }
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
      <app-table-pagination
        [page]="query().page"
        [pageSize]="query().pageSize"
        [total]="total()"
        (pageChange)="onPage($event)"
        (pageSizeChange)="onPageSize($event)"
      />
    </div>
  `,
})
export class Table {
  readonly columns = input.required<ReadonlyArray<TableColumn>>();
  readonly rows = input<ReadonlyArray<TableRow>>([]);
  readonly total = input(0);
  readonly loading = input(false);
  readonly query = input.required<TableQuery>();
  readonly emptyMessage = input('No results found');
  readonly exportData = input<ExportDataProvider | undefined>(undefined);
  readonly exportFilename = input('export.xlsx');
  readonly queryChange = output<TableQuery>();

  private readonly exports = inject(TableExportService);
  private readonly cellDefs = contentChildren(CellDef);
  readonly exporting = signal(false);

  readonly templates = computed(
    () => new Map(this.cellDefs().map((def) => [def.key(), def.template])),
  );
  readonly hasActiveFilters = computed(() => {
    const query = this.query();
    return !!query.search || Object.keys(query.filters).length > 0;
  });
  readonly skeletonRows = computed(() =>
    Array.from({ length: this.query().pageSize }, (_, i) => i),
  );

  cellTemplate(key: string): TemplateRef<{ $implicit: TableRow }> | null {
    return (this.templates().get(key) as TemplateRef<{ $implicit: TableRow }>) ?? null;
  }

  onSortRequested(key: string): void {
    const query = this.query();
    const dir: SortDirection | undefined =
      query.sortKey !== key ? 'asc' : query.sortDir === 'asc' ? 'desc' : undefined;
    this.queryChange.emit({ ...query, sortKey: dir ? key : undefined, sortDir: dir });
  }

  onSearch(search: string): void {
    this.patch({ search }, true);
  }

  onFilter(key: string, value: string): void {
    const filters = { ...this.query().filters };
    if (value) {
      filters[key] = value;
    } else {
      delete filters[key];
    }
    this.patch({ filters }, true);
  }

  onClear(): void {
    const query = this.query();
    this.queryChange.emit({
      ...query,
      page: 1,
      search: '',
      filters: {},
      sortKey: undefined,
      sortDir: undefined,
    });
  }

  onPage(page: number): void {
    this.patch({ page });
  }

  onPageSize(pageSize: number): void {
    this.patch({ pageSize, page: 1 });
  }

  async onExport(): Promise<void> {
    const provider = this.exportData();
    if (!provider || this.exporting()) {
      return;
    }
    this.exporting.set(true);
    try {
      const rows = await provider(this.query());
      await this.exports.exportToXlsx(this.columns(), rows, this.exportFilename());
    } finally {
      this.exporting.set(false);
    }
  }

  private patch(patch: Partial<TableQuery>, resetPage = false): void {
    const query = this.query();
    this.queryChange.emit({ ...query, ...patch, page: resetPage ? 1 : (patch.page ?? query.page) });
  }

  cellText(column: TableColumn, row: TableRow): string {
    return resolveCellValue(column, row);
  }
}
