import { Component, OnDestroy, input, linkedSignal, output } from '@angular/core';
import { Button } from '@shared/button/button';

const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-table-toolbar',
  imports: [Button],
  template: `
    <div class="flex flex-wrap items-center gap-8">
      <input
        type="search"
        aria-label="Search records"
        placeholder="Search…"
        [value]="searchValue()"
        (input)="onSearchInput($event)"
        class="rounded-control border border-transparent bg-surface-alt px-12 py-8 text-body text-ink placeholder:text-faint-gray focus:bg-paper focus:outline-none focus:ring-1 focus:ring-teal"
      />
      @if (hasActiveFilters()) {
        <app-button variant="ghost" (clicked)="clearRequested.emit()">Clear</app-button>
      }
      @if (canExport()) {
        <app-button variant="secondary" [loading]="exporting()" (clicked)="exportRequested.emit()">
          Export
        </app-button>
      }
    </div>
  `,
})
export class TableToolbar implements OnDestroy {
  readonly search = input('');
  readonly canExport = input(false);
  readonly exporting = input(false);
  readonly hasActiveFilters = input(false);
  readonly searchChange = output<string>();
  readonly exportRequested = output<void>();
  readonly clearRequested = output<void>();

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
