import { Component, computed, input, output } from '@angular/core';
import { Link } from '@shared/link/link';
import { formatTimeEs } from '../../agenda-dates';
import { APPOINTMENT_STATUS_META } from '../../appointment-status';
import { AppointmentResponse } from '../../appointments.service';
import { AgendaStatusActions } from '../agenda-status-actions/agenda-status-actions';

// Selected appointment detail for the agenda sidebar.
@Component({
  selector: 'app-agenda-detail-panel',
  imports: [AgendaStatusActions, Link],
  templateUrl: './agenda-detail-panel.html',
  host: { class: 'block' },
})
export class AgendaDetailPanel {
  readonly appointment = input<AppointmentResponse | null>(null);

  readonly closed = output<void>();

  readonly statusLabel = computed(() => {
    const appointment = this.appointment();
    return appointment ? APPOINTMENT_STATUS_META[appointment.status ?? 'programada'].label : '';
  });

  readonly statusBadge = computed(() => {
    const appointment = this.appointment();
    return appointment ? APPOINTMENT_STATUS_META[appointment.status ?? 'programada'].badge : '';
  });

  readonly patientRoute = computed(() => {
    const id = this.appointment()?.patientId;
    return id ? `/patients/${id}` : null;
  });

  formatTime(value: string | undefined): string {
    return formatTimeEs(value);
  }

  // Two-letter initials from the first two words of a patient name.
  initials(name: string | undefined): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const second = parts[1]?.[0] ?? '';
    return (first + second).toUpperCase() || '?';
  }

  // Colombian peso formatting without decimal places.
  formatCop(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
