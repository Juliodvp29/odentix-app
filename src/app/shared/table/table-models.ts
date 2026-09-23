export type SortDirection = 'asc' | 'desc';

export interface DateRange {
  readonly from?: string;
  readonly to?: string;
}

export interface NumberRange {
  readonly min?: number;
  readonly max?: number;
}

export type FilterValue = string | ReadonlyArray<string> | DateRange | NumberRange;

export type ColumnFilterDescriptor =
  | { readonly kind: 'select'; readonly options: ReadonlyArray<TableFilterOption> }
  | { readonly kind: 'multi'; readonly options: ReadonlyArray<TableFilterOption> }
  | { readonly kind: 'date' }
  | { readonly kind: 'number' };

export type CellType = 'text' | 'status' | 'avatar' | 'date' | 'currency';
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'teal';

export interface TableQuery {
  readonly page: number;
  readonly pageSize: number;
  readonly sortKey?: string;
  readonly sortDir?: SortDirection;
  readonly search?: string;
  readonly filters: Record<string, FilterValue>;
}

export interface TableFilterOption {
  readonly value: string;
  readonly label: string;
}

export type TableRow = Record<string, unknown>;

export interface TableColumn {
  readonly key: string;
  readonly header: string;
  readonly sortable?: boolean;
  readonly filter?: ColumnFilterDescriptor;
  readonly type?: CellType;
  readonly statusTones?: Record<string, StatusTone>;
  readonly accessor?: (row: TableRow) => string | number;
}

// Returns the rows matching the query IGNORING pagination (page/pageSize),
// so the export covers the whole filtered dataset, not just one page.
export type ExportDataProvider = (
  query: TableQuery,
) => Promise<ReadonlyArray<TableRow>> | ReadonlyArray<TableRow>;

export function createInitialQuery(pageSize = 10): TableQuery {
  return { page: 1, pageSize, filters: {} };
}

export function resolveCellValue(column: TableColumn, row: TableRow): string | number {
  if (column.accessor) {
    return column.accessor(row);
  }
  const value = row[column.key];
  if (value === null || value === undefined) {
    return '';
  }
  return typeof value === 'number' ? value : String(value);
}

export function isFilterActive(value: FilterValue | undefined): boolean {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value === 'string') {
    return value !== '';
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if ('from' in value || 'to' in value) {
    const range = value as DateRange;
    return !!range.from || !!range.to;
  }
  const range = value as NumberRange;
  return range.min !== undefined || range.max !== undefined;
}

export function activeFilterCount(filters: Record<string, FilterValue>): number {
  return Object.values(filters).filter(isFilterActive).length;
}

export function describeFilter(column: TableColumn, value: FilterValue): string {
  const filter = column.filter;
  if (!filter) {
    return column.header;
  }
  switch (filter.kind) {
    case 'select': {
      const label = filter.options.find((option) => option.value === value)?.label ?? value;
      return `${column.header}: ${label}`;
    }
    case 'multi': {
      const selected = Array.isArray(value) ? value : [];
      if (selected.length === 1) {
        const label = filter.options.find((option) => option.value === selected[0])?.label;
        return `${column.header}: ${label ?? selected[0]}`;
      }
      return `${column.header}: ${selected.length} seleccionados`;
    }
    case 'date': {
      const range = value as DateRange;
      if (range.from && range.to) {
        return `${column.header}: ${formatDateEs(range.from)} – ${formatDateEs(range.to)}`;
      }
      if (range.from) {
        return `${column.header}: desde ${formatDateEs(range.from)}`;
      }
      return `${column.header}: hasta ${formatDateEs(range.to ?? '')}`;
    }
    case 'number': {
      const range = value as NumberRange;
      if (range.min !== undefined && range.max !== undefined) {
        return `${column.header}: ${range.min} – ${range.max}`;
      }
      if (range.min !== undefined) {
        return `${column.header}: ≥ ${range.min}`;
      }
      return `${column.header}: ≤ ${range.max ?? ''}`;
    }
  }
}

export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

export function formatDateEs(isoDate: string): string {
  const date = new Date(isoDate.includes('T') ? isoDate : `${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatCurrencyCop(value: string | number): string {
  const amount = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(amount)) {
    return String(value);
  }
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}
