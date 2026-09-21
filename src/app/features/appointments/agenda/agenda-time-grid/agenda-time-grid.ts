import { Component, computed, input, output } from '@angular/core';
import {
  HOUR_HEIGHT_PX,
  PositionedBlock,
  WORKDAY_END_HOUR,
  WORKDAY_START_HOUR,
  formatTimeEs,
  layoutBlocks,
  minutesOfDay,
} from '../../agenda-dates';
import { APPOINTMENT_STATUS_META } from '../../appointment-status';
import { AppointmentResponse } from '../../appointments.service';

export interface TimeGridColumn {
  readonly professionalId: string | null;
  readonly professionalName: string;
  readonly appointments: ReadonlyArray<AppointmentResponse>;
}

interface PositionedAppointment {
  readonly appointment: AppointmentResponse;
  readonly block: PositionedBlock;
}

// Day time grid: hour gutter plus one column per professional, blocks
// positioned by time with overlaps side by side.
@Component({
  selector: 'app-agenda-time-grid',
  templateUrl: './agenda-time-grid.html',
  host: { class: 'block' },
})
export class AgendaTimeGrid {
  readonly columns = input.required<ReadonlyArray<TimeGridColumn>>();
  readonly showNowLine = input(false);

  readonly appointmentPicked = output<AppointmentResponse>();
  readonly freeSlotPicked = output<void>();

  readonly hours = Array.from(
    { length: WORKDAY_END_HOUR - WORKDAY_START_HOUR },
    (_, index) => WORKDAY_START_HOUR + index,
  );
  readonly hourHeight = HOUR_HEIGHT_PX;
  readonly gutterWidth = 80;
  readonly gridHeight = (WORKDAY_END_HOUR - WORKDAY_START_HOUR) * HOUR_HEIGHT_PX;
  readonly nowTop = (() => {
    const now = new Date();
    return (
      ((now.getHours() * 60 + now.getMinutes() - WORKDAY_START_HOUR * 60) / 60) * HOUR_HEIGHT_PX
    );
  })();
  readonly showNow = computed(
    () =>
      this.showNowLine() &&
      this.nowTop >= 0 &&
      this.nowTop <= (WORKDAY_END_HOUR - WORKDAY_START_HOUR) * HOUR_HEIGHT_PX,
  );

  readonly positioned = computed<ReadonlyArray<PositionedAppointment[]>>(() =>
    this.columns().map((column) => {
      const spans = column.appointments.map((appointment) => ({
        startMin: minutesOfDay(appointment.startsAt) ?? WORKDAY_START_HOUR * 60,
        endMin: minutesOfDay(appointment.endsAt) ?? (minutesOfDay(appointment.startsAt) ?? 0) + 30,
      }));
      const blocks = layoutBlocks(spans);
      return column.appointments.map((appointment, index) => ({
        appointment,
        block: blocks[index] ?? { topPx: 0, heightPx: 24, column: 0, columns: 1 },
      }));
    }),
  );

  formatHour(hour: number): string {
    return formatTimeEs(`2000-01-01T${String(hour).padStart(2, '0')}:00:00`);
  }

  formatTime(value: string | undefined): string {
    return formatTimeEs(value);
  }

  statusLabel(appointment: AppointmentResponse): string {
    return APPOINTMENT_STATUS_META[appointment.status ?? 'programada'].label;
  }

  statusBadge(appointment: AppointmentResponse): string {
    return APPOINTMENT_STATUS_META[appointment.status ?? 'programada'].badge;
  }

  statusDot(appointment: AppointmentResponse): string {
    const dots: Record<string, string> = {
      programada: 'bg-info',
      confirmada: 'bg-success',
      atendida: 'bg-success',
      no_show: 'bg-warning',
      cancelada: 'bg-danger',
    };
    return dots[appointment.status ?? 'programada'] ?? 'bg-mid-gray';
  }

  blockTop(positioned: PositionedAppointment): number {
    return positioned.block.topPx;
  }

  blockHeight(positioned: PositionedAppointment): number {
    return positioned.block.heightPx;
  }

  blockLeft(positioned: PositionedAppointment): string {
    return `calc(${(positioned.block.column * (100 / positioned.block.columns)).toFixed(2)}% + 4px)`;
  }

  blockWidth(positioned: PositionedAppointment): string {
    return `calc(${(100 / positioned.block.columns).toFixed(2)}% - 8px)`;
  }

  // Two-letter initials from the first two words of a name.
  initials(name: string | undefined): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const second = parts[1]?.[0] ?? '';
    return (first + second).toUpperCase() || '?';
  }

  // Formatted current time for the now-line gutter label.
  readonly nowTimeLabel = (() => {
    const now = new Date();
    return formatTimeEs(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`,
    );
  })();
}
