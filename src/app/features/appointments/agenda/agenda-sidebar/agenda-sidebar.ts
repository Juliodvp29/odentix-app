import { Component, input, output } from '@angular/core';
import { AppointmentResponse } from '../../appointments.service';
import { AgendaDetailPanel } from '../agenda-detail-panel/agenda-detail-panel';
import { AgendaMiniCalendar } from '../agenda-mini-calendar/agenda-mini-calendar';

export interface AgendaLegendEntry {
  readonly status: string;
  readonly label: string;
  readonly badge: string;
  readonly dot: string;
}

// Right-hand column of the agenda: month navigator, selected appointment
// detail, and the status convention legend.
@Component({
  selector: 'app-agenda-sidebar',
  imports: [AgendaDetailPanel, AgendaMiniCalendar],
  templateUrl: './agenda-sidebar.html',
  host: { class: 'block' },
})
export class AgendaSidebar {
  readonly anchorIsoDate = input.required<string>();
  readonly selectedAppointment = input<AppointmentResponse | null>(null);
  readonly legend = input<ReadonlyArray<AgendaLegendEntry>>([]);

  readonly previousMonth = output<void>();
  readonly nextMonth = output<void>();
  readonly dayPicked = output<string>();
  readonly closed = output<void>();
}
