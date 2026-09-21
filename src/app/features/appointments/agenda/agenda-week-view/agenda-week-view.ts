import { Component, input } from '@angular/core';
import { formatTimeEs } from '../../agenda-dates';
import { APPOINTMENT_STATUS_META, AppointmentStatus } from '../../appointment-status';
import { AppointmentResponse } from '../../appointments.service';

export interface AgendaDayColumn {
  readonly isoDate: string;
  readonly label: string;
  readonly isToday: boolean;
  readonly appointments: ReadonlyArray<AppointmentResponse>;
}

// Seven compact day columns for the week view.
@Component({
  selector: 'app-agenda-week-view',
  templateUrl: './agenda-week-view.html',
  host: { class: 'block' },
})
export class AgendaWeekView {
  readonly columns = input.required<ReadonlyArray<AgendaDayColumn>>();

  formatTime(value: string | undefined): string {
    return formatTimeEs(value);
  }

  statusLabel(status: AppointmentStatus | undefined): string {
    return APPOINTMENT_STATUS_META[status ?? 'programada'].label;
  }

  statusBadge(status: AppointmentStatus | undefined): string {
    return APPOINTMENT_STATUS_META[status ?? 'programada'].badge;
  }
}
