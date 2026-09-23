import { Component, input, output } from '@angular/core';
import { TableColumn } from './table-models';

@Component({
  selector: 'thead[appTableHeader]',
  template: `
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
              [attr.aria-label]="'Ordenar por ' + column.header"
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
      @if (hasActions()) {
        <th scope="col" class="border-b border-hairline px-16 py-8">
          <span class="sr-only">Acciones</span>
        </th>
      }
    </tr>
  `,
})
export class TableHeader {
  readonly columns = input.required<ReadonlyArray<TableColumn>>();
  readonly sortKey = input<string | undefined>(undefined);
  readonly sortDir = input<'asc' | 'desc' | undefined>(undefined);
  readonly hasActions = input(false);
  readonly sortRequested = output<string>();

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

  requestSort(column: TableColumn): void {
    if (column.sortable) {
      this.sortRequested.emit(column.key);
    }
  }
}
