import { HttpErrorResponse } from '@angular/common/http';
import { Component, TemplateRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Button } from '@shared/button/button';
import { ModalHandle, ModalService } from '@shared/modal/modal.service';
import { ToastService } from '@shared/toast/toast.service';
import {
  APPOINTMENT_STATUS_ACTIONS,
  AppointmentStatus,
  allowedTransitions,
} from '../../appointment-status';
import { AppointmentResponse, AppointmentsService } from '../../appointments.service';

const SUCCESS_MESSAGES: Record<AppointmentStatus, string> = {
  programada: 'Cita actualizada.',
  confirmada: 'Cita confirmada.',
  atendida: 'Cita marcada como atendida.',
  no_show: 'Cita marcada como no asistió.',
  cancelada: 'Cita cancelada.',
};

// Surfaces the backend's own Spanish error message when it rejects a transition.
function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
    return error.error.message;
  }
  return 'No pudimos cambiar el estado. Intenta de nuevo.';
}

// Status transition controls for an appointment. Only valid transitions
// render as actions; canceling requires an explicit confirmation step.
@Component({
  selector: 'app-agenda-status-actions',
  imports: [Button],
  templateUrl: './agenda-status-actions.html',
  host: { class: 'block' },
})
export class AgendaStatusActions {
  readonly appointment = input.required<AppointmentResponse>();

  private readonly appointments = inject(AppointmentsService);
  private readonly modals = inject(ModalService);
  private readonly toasts = inject(ToastService);
  private readonly confirmTemplate = viewChild.required<TemplateRef<unknown>>('confirmTemplate');
  private confirmDialog: ModalHandle | null = null;

  readonly pending = signal<AppointmentStatus | null>(null);

  readonly transitions = computed(() => allowedTransitions(this.appointment().status));

  readonly isFinal = computed(() => this.transitions().length === 0);

  readonly actions = computed(() =>
    this.transitions().map((status) => {
      const meta = APPOINTMENT_STATUS_ACTIONS[status];
      return {
        status,
        label: meta.label,
        variant: meta.variant,
        loading: this.pending() === status,
        disabled: this.pending() !== null,
      };
    }),
  );

  request(status: AppointmentStatus): void {
    if (this.pending()) {
      return;
    }
    if (status === 'cancelada') {
      this.confirmDialog = this.modals.open(this.confirmTemplate(), { title: 'Cancelar cita' });
      return;
    }
    void this.apply(status);
  }

  confirmCancel(): void {
    this.closeConfirm();
    void this.apply('cancelada');
  }

  dismissCancel(): void {
    this.closeConfirm();
  }

  private closeConfirm(): void {
    this.confirmDialog?.close();
    this.confirmDialog = null;
  }

  private async apply(status: AppointmentStatus): Promise<void> {
    const { id } = this.appointment();
    if (!id || this.pending()) {
      return;
    }
    this.pending.set(status);
    try {
      await firstValueFrom(this.appointments.updateStatus(id, status));
      this.toasts.success(SUCCESS_MESSAGES[status]);
    } catch (error) {
      this.toasts.error(errorMessage(error));
    } finally {
      this.pending.set(null);
    }
  }
}
