import { Component, OnDestroy, input, linkedSignal, output } from '@angular/core';
import { Button } from '@shared/button/button';

const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-table-bar',
  imports: [Button],
  host: { class: 'block' },
  template: `
    <div class="flex flex-wrap items-center justify-between gap-8">
      <div class="relative min-w-0 flex-1">
        <input
          type="search"
          aria-label="Buscar registros"
          placeholder="Buscar…"
          [value]="searchValue()"
          (input)="onSearchInput($event)"
          class="w-full rounded-control border border-transparent bg-surface-alt px-12 py-8 text-body text-ink placeholder:text-mid-gray focus:bg-paper focus:outline-none focus:ring-1 focus:ring-teal"
        />
      </div>
      <div class="flex flex-wrap items-center gap-8">
        @if (hasFilters()) {
          <app-button
            variant="secondary"
            (clicked)="filtersToggle.emit()"
            [attr.aria-expanded]="filtersOpen()"
          >
            Filtros
            @if (activeFilterCount() > 0) {
              <span
                class="ml-4 rounded-pill bg-teal-soft px-8 py-4 text-caption font-medium text-teal-deep"
              >
                {{ activeFilterCount() }}
              </span>
            }
          </app-button>
        }
        @if (canExport()) {
          <app-button
            variant="secondary"
            [loading]="exporting()"
            icon="download"
            iconPosition="end"
            (clicked)="exportRequested.emit()"
          >
            Exportar
          </app-button>
        }
      </div>
    </div>
  `,
})
export class TableBar implements OnDestroy {
  readonly search = input('');
  readonly activeFilterCount = input(0);
  readonly filtersOpen = input(false);
  readonly hasFilters = input(false);
  readonly canExport = input(false);
  readonly exporting = input(false);
  readonly searchChange = output<string>();
  readonly filtersToggle = output<void>();
  readonly exportRequested = output<void>();

  protected readonly searchValue = linkedSignal(() => this.search());
  private timer: ReturnType<typeof setTimeout> | null = null;

  ngOnDestroy(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchValue.set(value);
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => this.searchChange.emit(value), SEARCH_DEBOUNCE_MS);
  }
}
