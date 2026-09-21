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
import { CellDef } from './cell-def';
import { TableActiveFilters } from './table-active-filters';
import { TableBar } from './table-bar';
import { TableExportService } from './table-export.service';
import { TableFilterPanel } from './table-filter-panel';
import { TableGrid } from './table-grid';
import {
  ExportDataProvider,
  FilterValue,
  SortDirection,
  TableColumn,
  TableQuery,
  TableRow,
  activeFilterCount as countActiveFilters,
  isFilterActive,
} from './table-models';
import { TablePagination } from './table-pagination';

@Component({
  selector: 'app-table',
  host: { class: 'block' },
  imports: [TableActiveFilters, TableBar, TableFilterPanel, TableGrid, TablePagination],
  template: `
    <div class="space-y-24">
      <app-table-bar
        [search]="query().search ?? ''"
        [activeFilterCount]="activeFilterCount()"
        [filtersOpen]="showFilters()"
        [canExport]="exportData() !== undefined"
        [exporting]="exporting()"
        (searchChange)="onSearch($event)"
        (filtersToggle)="showFilters.update((open) => !open)"
        (exportRequested)="onExport()"
      />
      @if (showFilters()) {
        <app-table-filter-panel
          [columns]="columns()"
          [filters]="query().filters"
          (filterChanged)="onFilter($event.key, $event.value)"
          (clearRequested)="onClear()"
        />
      }
      @if (activeFilterCount() > 0) {
        <app-table-active-filters
          [columns]="columns()"
          [filters]="query().filters"
          (remove)="onFilter($event, '')"
        />
      }
      <app-table-grid
        [columns]="columns()"
        [rows]="rows()"
        [loading]="loading()"
        [sortKey]="query().sortKey"
        [sortDir]="query().sortDir"
        [pageSize]="query().pageSize"
        [emptyMessage]="emptyMessage()"
        [hasActions]="rowActions() !== null"
        [templates]="templates()"
        [actions]="rowActions()"
        (sortRequested)="onSortRequested($event)"
      />
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
  readonly rowActions = input<TemplateRef<{ $implicit: TableRow }> | null>(null);
  readonly queryChange = output<TableQuery>();

  private readonly exports = inject(TableExportService);
  private readonly cellDefs = contentChildren(CellDef);
  readonly exporting = signal(false);
  readonly showFilters = signal(false);

  readonly templates = computed(
    () => new Map(this.cellDefs().map((def) => [def.key(), def.template])),
  );
  readonly activeFilterCount = computed(() => countActiveFilters(this.query().filters));

  onSortRequested(key: string): void {
    const query = this.query();
    const dir: SortDirection | undefined =
      query.sortKey !== key ? 'asc' : query.sortDir === 'asc' ? 'desc' : undefined;
    this.queryChange.emit({ ...query, sortKey: dir ? key : undefined, sortDir: dir });
  }

  onSearch(search: string): void {
    this.patch({ search }, true);
  }

  onFilter(key: string, value: FilterValue): void {
    const filters = { ...this.query().filters };
    if (isFilterActive(value)) {
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
}
