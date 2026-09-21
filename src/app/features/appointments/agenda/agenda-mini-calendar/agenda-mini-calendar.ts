import { Component, computed, input, output } from '@angular/core';
import { Icon } from '@shared/icon/icon';
import { MonthCell, formatDayRangeEs, monthCells } from '../../agenda-dates';

// Compact month navigator that jumps to a day.
@Component({
  selector: 'app-agenda-mini-calendar',
  imports: [Icon],
  templateUrl: './agenda-mini-calendar.html',
  host: { class: 'block' },
})
export class AgendaMiniCalendar {
  readonly anchorIsoDate = input.required<string>();
  readonly selectedIsoDate = input.required<string>();

  readonly dayPicked = output<string>();

  readonly title = computed(() => formatDayRangeEs('month', this.anchorIsoDate()));
  readonly cells = computed<MonthCell[]>(() => {
    const [year, month] = this.anchorIsoDate().split('-').map(Number);
    return monthCells(year ?? 2026, month ?? 1);
  });

  previousMonth = output<void>();
  nextMonth = output<void>();
}
