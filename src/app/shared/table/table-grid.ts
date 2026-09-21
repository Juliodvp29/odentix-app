import { NgTemplateOutlet } from '@angular/common';
import { Component, TemplateRef, computed, input, output } from '@angular/core';
import { Skeleton } from '@shared/skeleton/skeleton';
import { TableCell } from './table-cell';
import { TableColumn, TableRow } from './table-models';
import { TableHeader } from './table-header';

@Component({
  selector: 'app-table-grid',
  imports: [NgTemplateOutlet, Skeleton, TableCell, TableHeader],
  host: { class: 'block' },
  template: `
    <div class="overflow-x-auto rounded-card bg-paper shadow-resting">
      <table class="w-full border-collapse text-left" [attr.aria-busy]="loading()">
        <thead
          appTableHeader
          [columns]="columns()"
          [sortKey]="sortKey()"
          [sortDir]="sortDir()"
          [hasActions]="hasActions()"
          (sortRequested)="sortRequested.emit($event)"
        ></thead>
        <tbody>
          @if (loading()) {
            @for (row of skeletonRows(); track row) {
              <tr>
                @for (column of columns(); track column.key) {
                  <td class="border-b border-hairline px-16 py-12">
                    <app-skeleton variant="line" />
                  </td>
                }
                @if (hasActions()) {
                  <td class="border-b border-hairline px-16 py-12">
                    <app-skeleton variant="line" />
                  </td>
                }
              </tr>
            }
          } @else if (rows().length === 0) {
            <tr>
              <td [attr.colspan]="columnCount()" class="px-16 py-32 text-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  aria-hidden="true"
                  class="mx-auto mb-8 h-24 w-24 text-faint-gray"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M3 9h18M9 9v11" />
                </svg>
                <p class="text-body text-mid-gray">{{ emptyMessage() }}</p>
              </td>
            </tr>
          } @else {
            @for (row of rows(); track $index) {
              <tr class="transition-colors duration-fast hover:bg-surface-alt">
                @for (column of columns(); track column.key) {
                  <td class="border-b border-hairline px-16 py-12 text-body text-ink">
                    @if (cellTemplate(column.key); as template) {
                      <ng-container *ngTemplateOutlet="template; context: { $implicit: row }" />
                    } @else {
                      <app-table-cell [column]="column" [row]="row" />
                    }
                  </td>
                }
                @if (actions(); as actionsTemplate) {
                  <td class="border-b border-hairline px-16 py-12">
                    <div class="flex items-center justify-end gap-4">
                      <ng-container
                        *ngTemplateOutlet="actionsTemplate; context: { $implicit: row }"
                      />
                    </div>
                  </td>
                }
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
  `,
})
export class TableGrid {
  readonly columns = input.required<ReadonlyArray<TableColumn>>();
  readonly rows = input<ReadonlyArray<TableRow>>([]);
  readonly loading = input(false);
  readonly sortKey = input<string | undefined>(undefined);
  readonly sortDir = input<'asc' | 'desc' | undefined>(undefined);
  readonly pageSize = input(10);
  readonly emptyMessage = input('No results found');
  readonly hasActions = input(false);
  readonly templates = input<Map<string, TemplateRef<{ $implicit: TableRow }>>>(new Map());
  readonly actions = input<TemplateRef<{ $implicit: TableRow }> | null>(null);
  readonly sortRequested = output<string>();

  readonly columnCount = computed(() => this.columns().length + (this.hasActions() ? 1 : 0));
  readonly skeletonRows = computed(() => Array.from({ length: this.pageSize() }, (_, i) => i));

  cellTemplate(key: string): TemplateRef<{ $implicit: TableRow }> | null {
    return this.templates().get(key) ?? null;
  }
}
