import { Component, computed, input } from '@angular/core';
import {
  StatusTone,
  TableColumn,
  TableRow,
  formatCurrencyCop,
  formatDateEs,
  initialsOf,
  resolveCellValue,
} from './table-models';

const toneClasses: Record<StatusTone | 'neutral', string> = {
  success: 'bg-success-soft text-success-deep',
  warning: 'bg-warning-soft text-warning-deep',
  danger: 'bg-danger-soft text-danger-deep',
  info: 'bg-info-soft text-info-deep',
  teal: 'bg-teal-soft text-teal-deep',
  neutral: 'bg-surface-alt text-mid-gray',
};

@Component({
  selector: 'app-table-cell',
  template: `
    @switch (column().type ?? 'text') {
      @case ('status') {
        <span [class]="badgeClasses()" style="padding: 2px 10px">{{ text() }}</span>
      }
      @case ('avatar') {
        <span
          [attr.title]="text()"
          class="inline-flex h-32 w-32 items-center justify-center rounded-pill bg-teal-soft text-caption font-medium text-teal-deep"
        >
          {{ initials() }}
        </span>
      }
      @case ('date') {
        {{ formattedDate() }}
      }
      @case ('currency') {
        {{ formattedCurrency() }}
      }
      @default {
        {{ text() }}
      }
    }
  `,
})
export class TableCell {
  readonly column = input.required<TableColumn>();
  readonly row = input.required<TableRow>();

  readonly text = computed(() => String(resolveCellValue(this.column(), this.row())));
  readonly initials = computed(() => initialsOf(this.text()));
  readonly formattedDate = computed(() =>
    formatDateEs(String(resolveCellValue(this.column(), this.row()))),
  );
  readonly formattedCurrency = computed(() =>
    formatCurrencyCop(resolveCellValue(this.column(), this.row())),
  );
  readonly badgeClasses = computed(() => {
    const tone = this.column().statusTones?.[this.text()] ?? 'neutral';
    return `inline-block rounded-pill text-caption font-medium ${toneClasses[tone]}`;
  });
}
