import { Component, OnDestroy, computed, input, output } from '@angular/core';
import { TableColumn } from './table-models';

export interface ColumnFilter {
  readonly key: string;
  readonly value: string;
}

const FILTER_DEBOUNCE_MS = 300;

@Component({
  selector: 'thead[appTableHeader]',
  template: `
    @if (hasColumnFilters()) {
      <tr>
        @for (column of columns(); track column.key) {
          <td class="border-b border-hairline px-16 py-8">
            @if (column.filterable) {
              @if (column.filterOptions; as options) {
                <div class="relative">
                  <select
                    [value]="filters()[column.key] ?? ''"
                    (change)="emitFilter(column.key, selectValue($event))"
                    [attr.aria-label]="'Filter by ' + column.header"
                    class="w-full appearance-none rounded-control border border-transparent bg-surface-alt py-8 pl-12 pr-32 text-body text-ink focus:bg-paper focus:outline-none focus:ring-1 focus:ring-teal"
                  >
                    <option value="">All</option>
                    @for (option of options; track option.value) {
                      <option [value]="option.value">{{ option.label }}</option>
                    }
                  </select>
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    aria-hidden="true"
                    class="pointer-events-none absolute top-1/2 right-12 h-16 w-16 -translate-y-1/2 text-mid-gray"
                  >
                    <path d="M4 6l4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
              } @else {
                <input
                  type="text"
                  [value]="filters()[column.key] ?? ''"
                  (input)="onFilterText(column.key, $event)"
                  [attr.aria-label]="'Filter by ' + column.header"
                  placeholder="Filter…"
                  class="w-full rounded-control border border-transparent bg-surface-alt px-12 py-8 text-body text-ink placeholder:text-faint-gray focus:bg-paper focus:outline-none focus:ring-1 focus:ring-teal"
                />
              }
            }
          </td>
        }
      </tr>
    }
    <tr>
      @for (column of columns(); track column.key) {
        <th
          scope="col"
          [attr.aria-sort]="sortState(column)"
          class="border-b border-hairline px-16 py-8 text-left text-caption font-medium uppercase text-mid-gray"
        >
          @if (column.sortable) {
            <button
              type="button"
              (click)="requestSort(column)"
              [attr.aria-label]="'Sort by ' + column.header"
              class="inline-flex items-center gap-4 uppercase hover:text-ink"
            >
              {{ column.header }}
              <span aria-hidden="true">{{ sortArrow(column) }}</span>
            </button>
          } @else {
            {{ column.header }}
          }
        </th>
      }
    </tr>
  `,
})
export class TableHeader implements OnDestroy {
  readonly columns = input.required<ReadonlyArray<TableColumn>>();
  readonly sortKey = input<string | undefined>(undefined);
  readonly sortDir = input<'asc' | 'desc' | undefined>(undefined);
  readonly filters = input<Record<string, string>>({});
  readonly sortRequested = output<string>();
  readonly filterChanged = output<ColumnFilter>();

  private filterTimer: ReturnType<typeof setTimeout> | null = null;

  readonly hasColumnFilters = computed(() => this.columns().some((column) => column.filterable));

  ngOnDestroy(): void {
    if (this.filterTimer) {
      clearTimeout(this.filterTimer);
    }
  }

  sortState(column: TableColumn): 'ascending' | 'descending' | null {
    if (this.sortKey() !== column.key) {
      return null;
    }
    return this.sortDir() === 'desc' ? 'descending' : 'ascending';
  }

  sortArrow(column: TableColumn): string {
    if (this.sortKey() !== column.key) {
      return '';
    }
    return this.sortDir() === 'desc' ? '↓' : '↑';
  }

  selectValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }

  requestSort(column: TableColumn): void {
    if (column.sortable) {
      this.sortRequested.emit(column.key);
    }
  }

  onFilterText(key: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (this.filterTimer) {
      clearTimeout(this.filterTimer);
    }
    this.filterTimer = setTimeout(
      () => this.filterChanged.emit({ key, value }),
      FILTER_DEBOUNCE_MS,
    );
  }

  emitFilter(key: string, value: string): void {
    this.filterChanged.emit({ key, value });
  }
}
