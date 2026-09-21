import { Component, computed, input, output } from '@angular/core';
import { MonthCell } from '../../agenda-dates';
import { AppointmentResponse } from '../../appointments.service';

export interface MonthDayColumn {
  readonly cell: MonthCell;
  readonly appointments: ReadonlyArray<AppointmentResponse>;
  readonly isToday: boolean;
  readonly isSelected: boolean;
}

const STATUS_DOT_COLORS: Record<string, string> = {
  programada: 'bg-info',
  confirmada: 'bg-teal',
  atendida: 'bg-success',
  no_show: 'bg-warning',
  cancelada: 'bg-danger',
};

// Month grid: day cells with status-dot counts and appointment chips.
@Component({
  selector: 'app-agenda-month-view',
  templateUrl: './agenda-month-view.html',
  host: { class: 'block' },
})
export class AgendaMonthView {
  readonly days = input.required<ReadonlyArray<MonthDayColumn>>();

  readonly dayPicked = output<string>();

  readonly weeks = computed<ReadonlyArray<ReadonlyArray<MonthDayColumn>>>(() => {
    const days = this.days();
    return Array.from({ length: 6 }, (_, week) => days.slice(week * 7, week * 7 + 7));
  });

  visibleAppointments(day: MonthDayColumn): ReadonlyArray<AppointmentResponse> {
    return day.appointments.slice(0, 3);
  }

  // Status dot counts for a day, only those with at least one appointment.
  statusDots(day: MonthDayColumn): ReadonlyArray<{ color: string; count: number }> {
    const counts: Record<string, number> = {};
    for (const appointment of day.appointments) {
      const status = appointment.status ?? 'programada';
      counts[status] = (counts[status] ?? 0) + 1;
    }
    return Object.entries(STATUS_DOT_COLORS)
      .filter(([status]) => (counts[status] ?? 0) > 0)
      .map(([status, color]) => ({ color, count: counts[status] ?? 0 }));
  }
}
