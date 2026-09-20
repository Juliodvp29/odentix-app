export type SortDirection = 'asc' | 'desc';

export interface TableQuery {
  readonly page: number;
  readonly pageSize: number;
  readonly sortKey?: string;
  readonly sortDir?: SortDirection;
  readonly search?: string;
  readonly filters: Record<string, string>;
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
  readonly filterable?: boolean;
  readonly filterOptions?: ReadonlyArray<TableFilterOption>;
  readonly accessor?: (row: TableRow) => string;
}

// Returns the rows matching the query IGNORING pagination (page/pageSize),
// so the export covers the whole filtered dataset, not just one page.
export type ExportDataProvider = (
  query: TableQuery,
) => Promise<ReadonlyArray<TableRow>> | ReadonlyArray<TableRow>;

export function createInitialQuery(pageSize = 10): TableQuery {
  return { page: 1, pageSize, filters: {} };
}

export function resolveCellValue(column: TableColumn, row: TableRow): string {
  if (column.accessor) {
    return column.accessor(row);
  }
  const value = row[column.key];
  return value === null || value === undefined ? '' : String(value);
}
