import {
  Component,
  TemplateRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Button } from '@shared/button/button';
import { Link } from '@shared/link/link';
import { ModalHandle, ModalService } from '@shared/modal/modal.service';
import { ToastService } from '@shared/toast/toast.service';
import { MessageComposeDialog } from '../../../assistant/message-compose-dialog/message-compose-dialog';
import { SentNotification, messageChannelLabel } from '../../../assistant/assistant-models';
import { formatTimeEs } from '../../agenda-dates';
import { APPOINTMENT_STATUS_META } from '../../appointment-status';
import { AppointmentResponse } from '../../appointments.service';
import { WaitlistEntryAction } from '../../waitlist/waitlist-entry-action/waitlist-entry-action';
import { AgendaStatusActions } from '../agenda-status-actions/agenda-status-actions';

@Component({
  selector: 'app-agenda-detail-panel',
  imports: [AgendaStatusActions, Button, Link, MessageComposeDialog, WaitlistEntryAction],
  templateUrl: './agenda-detail-panel.html',
  host: { class: 'block' },
})
export class AgendaDetailPanel {
  readonly appointment = input<AppointmentResponse | null>(null);
  readonly closed = output<void>();
  readonly converted = output<AppointmentResponse>();

  private readonly modals = inject(ModalService);
  private readonly toasts = inject(ToastService);
  private readonly composeTemplate = viewChild.required<TemplateRef<unknown>>('composeTemplate');
  private composeDialog: ModalHandle | null = null;

  readonly composingAppointmentId = signal<string | null>(null);

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

  initials(name: string | undefined): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const second = parts[1]?.[0] ?? '';
    return (first + second).toUpperCase() || '?';
  }

  formatCop(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  openCompose(): void {
    const id = this.appointment()?.id;
    if (!id) {
      return;
    }
    this.composingAppointmentId.set(id);
    this.composeDialog = this.modals.open(this.composeTemplate(), {
      title: 'Redactar mensaje',
    });
  }

  onMessageSent(notification: SentNotification): void {
    this.composeDialog?.close();
    this.composeDialog = null;
    this.composingAppointmentId.set(null);
    if (notification.status === 'enviada') {
      this.toasts.success(`Mensaje enviado por ${messageChannelLabel(notification.channel)}.`);
    } else {
      this.toasts.error(
        `No se pudo entregar el mensaje: ${notification.errorDetail || 'sin detalle'}.`,
      );
    }
  }

  onComposeCancelled(): void {
    this.composeDialog?.close();
    this.composeDialog = null;
    this.composingAppointmentId.set(null);
  }
}
