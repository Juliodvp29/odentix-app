import { Component, computed, input, output } from '@angular/core';
import { Button } from '@shared/button/button';
import { Icon } from '@shared/icon/icon';

@Component({
  selector: 'app-table-pagination',
  imports: [Button, Icon],
  host: { class: 'block' },
  template: `
    <nav aria-label="Pagination" class="flex flex-wrap items-center gap-16">
      <p class="text-body text-mid-gray">{{ rangeText() }}</p>
      <div class="flex items-center gap-8">
        <app-button variant="ghost" [disabled]="!canPrevious()" (clicked)="goTo(page() - 1)">
          Previous
        </app-button>
        <app-button variant="ghost" [disabled]="!canNext()" (clicked)="goTo(page() + 1)">
          Next
        </app-button>
      </div>
      <label class="flex items-center gap-8 text-body text-mid-gray">
        Per page
        <span class="relative inline-flex">
          <select
            aria-label="Rows per page"
            [value]="pageSize()"
            (change)="onPageSizeChange($event)"
            class="appearance-none rounded-control border border-transparent bg-surface-alt py-8 pl-12 pr-32 text-body text-ink focus:bg-paper focus:outline-none focus:ring-1 focus:ring-teal"
          >
            @for (option of pageSizeOptions(); track option) {
              <option [value]="option">{{ option }}</option>
            }
          </select>
          <span
            class="pointer-events-none absolute top-1/2 right-12 inline-flex h-16 w-16 -translate-y-1/2 items-center justify-center text-mid-gray"
          >
            <app-icon name="chevron-down" />
          </span>
        </span>
      </label>
    </nav>
  `,
})
export class TablePagination {
  readonly page = input(1);
  readonly pageSize = input(10);
  readonly total = input(0);
  readonly pageSizeOptions = input([10, 20, 50]);
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  readonly canPrevious = computed(() => this.page() > 1);
  readonly canNext = computed(() => this.page() < this.totalPages());
  readonly rangeText = computed(() => {
    if (this.total() === 0) {
      return '0 of 0';
    }
    const start = (this.page() - 1) * this.pageSize() + 1;
    const end = Math.min(this.page() * this.pageSize(), this.total());
    return `${start}–${end} of ${this.total()}`;
  });

  goTo(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.page()) {
      this.pageChange.emit(page);
    }
  }

  onPageSizeChange(event: Event): void {
    this.pageSizeChange.emit(Number((event.target as HTMLSelectElement).value));
  }
}
