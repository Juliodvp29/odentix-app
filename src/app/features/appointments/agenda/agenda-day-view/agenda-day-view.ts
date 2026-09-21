import { Component, input } from '@angular/core';
import { formatTimeEs } from '../../agenda-dates';
import { APPOINTMENT_STATUS_META, AppointmentStatus } from '../../appointment-status';
import { AppointmentResponse } from '../../appointments.service';

// Chronological list of one day's appointments.
@Component({
  selector: 'app-agenda-day-view',
  templateUrl: './agenda-day-view.html',
  host: { class: 'block' },
})
export class AgendaDayView {
  readonly appointments = input.required<ReadonlyArray<AppointmentResponse>>();

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
