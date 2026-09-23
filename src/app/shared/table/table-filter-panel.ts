import { Component, computed, input, output } from '@angular/core';
import { Button } from '@shared/button/button';
import { DateRange, FilterValue, NumberRange, TableColumn } from './table-models';

export interface ColumnFilter {
  readonly key: string;
  readonly value: FilterValue;
}

const controlClasses =
  'w-full rounded-control border border-transparent bg-surface-alt px-12 py-8 ' +
  'text-body text-ink focus:bg-paper focus:outline-none focus:ring-1 focus:ring-teal';

@Component({
  selector: 'app-table-filter-panel',
  imports: [Button],
  host: { class: 'block' },
  template: `
    <div class="space-y-16 rounded-card bg-paper p-16 shadow-raised">
      <div class="flex items-center justify-between">
        <p class="text-body font-medium text-ink">Filtros</p>
        <app-button variant="ghost" (clicked)="clearRequested.emit()">Limpiar todo</app-button>
      </div>
      @for (column of filterableColumns(); track column.key) {
        <div class="space-y-8">
          <p class="text-caption font-medium text-mid-gray">{{ column.header }}</p>
          @switch (column.filter?.kind) {
            @case ('select') {
              @for (option of selectOptions(column); track option.value) {
                <label class="flex items-center gap-8 text-body text-ink">
                  <input
                    type="radio"
                    [name]="'filter-' + column.key"
                    [value]="option.value"
                    [checked]="isSelected(column.key, option.value)"
                    (change)="emitFilter(column.key, option.value)"
                    class="accent-teal"
                  />
                  {{ option.label }}
                </label>
              }
            }
            @case ('multi') {
              @for (option of selectOptions(column); track option.value) {
                <label class="flex items-center gap-8 text-body text-ink">
                  <input
                    type="checkbox"
                    [value]="option.value"
                    [checked]="isSelected(column.key, option.value)"
                    (change)="toggleMulti(column.key, option.value)"
                    class="accent-teal"
                  />
                  {{ option.label }}
                </label>
              }
            }
            @case ('date') {
              <div class="flex flex-wrap items-center gap-8">
                <label class="flex items-center gap-8 text-caption text-mid-gray">
                  Desde
                  <input
                    type="date"
                    [value]="dateRange(column.key).from ?? ''"
                    (change)="emitDate(column.key, 'from', dateValue($event))"
                    [attr.aria-label]="column.header + ' desde'"
                    [class]="controlClasses"
                  />
                </label>
                <label class="flex items-center gap-8 text-caption text-mid-gray">
                  Hasta
                  <input
                    type="date"
                    [value]="dateRange(column.key).to ?? ''"
                    (change)="emitDate(column.key, 'to', dateValue($event))"
                    [attr.aria-label]="column.header + ' hasta'"
                    [class]="controlClasses"
                  />
                </label>
              </div>
            }
            @case ('number') {
              <div class="flex flex-wrap items-center gap-8">
                <label class="flex items-center gap-8 text-caption text-mid-gray">
                  Mínimo
                  <input
                    type="number"
                    [value]="numberRange(column.key).min ?? ''"
                    (change)="emitNumber(column.key, 'min', numberValue($event))"
                    [attr.aria-label]="column.header + ' mínimo'"
                    [class]="controlClasses"
                  />
                </label>
                <label class="flex items-center gap-8 text-caption text-mid-gray">
                  Máximo
                  <input
                    type="number"
                    [value]="numberRange(column.key).max ?? ''"
                    (change)="emitNumber(column.key, 'max', numberValue($event))"
                    [attr.aria-label]="column.header + ' máximo'"
                    [class]="controlClasses"
                  />
                </label>
              </div>
            }
          }
        </div>
      }
    </div>
  `,
})
export class TableFilterPanel {
  readonly columns = input.required<ReadonlyArray<TableColumn>>();
  readonly filters = input<Record<string, FilterValue>>({});
  readonly filterChanged = output<ColumnFilter>();
  readonly clearRequested = output<void>();

  readonly controlClasses = controlClasses;

  readonly filterableColumns = computed(() => this.columns().filter((column) => column.filter));

  selectOptions(column: TableColumn): ReadonlyArray<{ value: string; label: string }> {
    const filter = column.filter;
    if (filter?.kind === 'select' || filter?.kind === 'multi') {
      return filter.options;
    }
    return [];
  }

  isSelected(key: string, value: string): boolean {
    const current = this.filters()[key];
    if (Array.isArray(current)) {
      return current.includes(value);
    }
    return current === value;
  }

  toggleMulti(key: string, value: string): void {
    const current = this.filters()[key];
    const selected = Array.isArray(current) ? [...current] : [];
    const next = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    this.filterChanged.emit({ key, value: next });
  }

  dateRange(key: string): DateRange {
    const current = this.filters()[key];
    return current !== undefined && !Array.isArray(current) && typeof current !== 'string'
      ? (current as DateRange)
      : {};
  }

  numberRange(key: string): NumberRange {
    const current = this.filters()[key];
    return current !== undefined && !Array.isArray(current) && typeof current !== 'string'
      ? (current as NumberRange)
      : {};
  }

  dateValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  numberValue(event: Event): number | undefined {
    const raw = (event.target as HTMLInputElement).value;
    if (raw === '') {
      return undefined;
    }
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  emitDate(key: string, bound: 'from' | 'to', value: string): void {
    const current = this.dateRange(key);
    const next: DateRange = { ...current, [bound]: value === '' ? undefined : value };
    this.filterChanged.emit({ key, value: next });
  }

  emitNumber(key: string, bound: 'min' | 'max', value: number | undefined): void {
    const current = this.numberRange(key);
    const next: NumberRange = { ...current, [bound]: value };
    this.filterChanged.emit({ key, value: next });
  }

  emitFilter(key: string, value: string): void {
    this.filterChanged.emit({ key, value });
  }
}
