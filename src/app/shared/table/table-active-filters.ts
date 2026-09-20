import { Component, computed, input, output } from '@angular/core';
import { FilterValue, TableColumn, describeFilter, isFilterActive } from './table-models';

export interface ActiveChip {
  readonly key: string;
  readonly label: string;
}

@Component({
  selector: 'app-table-active-filters',
  template: `
    <div class="flex flex-wrap gap-8">
      @for (chip of chips(); track chip.key) {
        <span
          class="inline-flex items-center gap-8 rounded-pill bg-surface-alt px-12 py-4 text-caption font-medium text-ink"
        >
          {{ chip.label }}
          <button
            type="button"
            (click)="remove.emit(chip.key)"
            [attr.aria-label]="'Remove filter ' + chip.label"
            class="inline-flex text-mid-gray hover:text-ink"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              aria-hidden="true"
              class="h-12 w-12"
            >
              <path d="M4 4l8 8M12 4l-8 8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </span>
      }
    </div>
  `,
})
export class TableActiveFilters {
  readonly columns = input.required<ReadonlyArray<TableColumn>>();
  readonly filters = input<Record<string, FilterValue>>({});
  readonly remove = output<string>();

  readonly chips = computed<ReadonlyArray<ActiveChip>>(() => {
    const filters = this.filters();
    return this.columns().flatMap((column) => {
      const value = filters[column.key];
      if (!column.filter || value === undefined || !isFilterActive(value)) {
        return [];
      }
      return [{ key: column.key, label: describeFilter(column, value) }];
    });
  });
}
