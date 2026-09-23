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
import { WaitlistRecoveryPanel } from '../../waitlist/waitlist-recovery-panel/waitlist-recovery-panel';
import { WaitlistEntryResponse, WaitlistService } from '../../waitlist/waitlist.service';

const SUCCESS_MESSAGES: Record<AppointmentStatus, string> = {
  programada: 'Cita actualizada.',
  confirmada: 'Cita confirmada.',
  atendida: 'Cita marcada como atendida.',
  no_show: 'Cita marcada como no asistió.',
  cancelada: 'Cita cancelada.',
};

// Surfaces the backend's own Spanish error message when it rejects a transition.
function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { message?: unknown; error?: unknown } | null;
    if (typeof body?.message === 'string') {
      return body.message;
    }
    if (typeof body?.error === 'string') {
      return body.error;
    }
  }
  return 'No pudimos cambiar el estado. Intenta de nuevo.';
}

// Status transition controls for an appointment. Only valid transitions
// render as actions; canceling requires an explicit confirmation step.
@Component({
  selector: 'app-agenda-status-actions',
  imports: [Button, WaitlistRecoveryPanel],
  templateUrl: './agenda-status-actions.html',
  host: { class: 'block' },
})
export class AgendaStatusActions {
  readonly appointment = input.required<AppointmentResponse>();

  private readonly appointments = inject(AppointmentsService);
  private readonly waitlist = inject(WaitlistService);
  private readonly modals = inject(ModalService);
  private readonly toasts = inject(ToastService);
  private readonly confirmTemplate = viewChild.required<TemplateRef<unknown>>('confirmTemplate');
  private confirmDialog: ModalHandle | null = null;

  readonly pending = signal<AppointmentStatus | null>(null);
  readonly cancellationCandidates = signal<WaitlistEntryResponse[]>([]);
  readonly candidatesLoading = signal(false);
  readonly candidateError = signal<string | null>(null);
  readonly cancellationError = signal<string | null>(null);
  readonly cancellationComplete = signal(false);

  readonly transitions = computed(() => allowedTransitions(this.appointment().status));

  readonly isFinal = computed(() => this.transitions().length === 0);
  readonly isHighRisk = computed(() => this.appointment().riskLevel === 'alto');
  readonly showRecovery = computed(() => this.isHighRisk() && this.cancellationComplete());

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
      this.resetCancellation();
      this.confirmDialog = this.modals.open(this.confirmTemplate(), { title: 'Cancelar cita' });
      return;
    }
    void this.apply(status);
  }

  confirmCancel(): void {
    this.cancellationError.set(null);
    void this.apply('cancelada');
  }

  dismissCancel(): void {
    this.closeConfirm();
  }

  retryCandidates(): void {
    const { id } = this.appointment();
    if (id && !this.candidatesLoading()) {
      void this.loadCandidates(id);
    }
  }

  private closeConfirm(): void {
    this.confirmDialog?.close();
    this.confirmDialog = null;
  }

  private resetCancellation(): void {
    this.cancellationCandidates.set([]);
    this.candidatesLoading.set(false);
    this.candidateError.set(null);
    this.cancellationError.set(null);
    this.cancellationComplete.set(false);
  }

  private async loadCandidates(id: string): Promise<void> {
    this.candidatesLoading.set(true);
    this.candidateError.set(null);
    try {
      const candidates = await firstValueFrom(this.waitlist.getCandidates(id));
      this.cancellationCandidates.set(candidates);
    } catch {
      this.candidateError.set('No pudimos cargar los candidatos. Intenta de nuevo.');
    } finally {
      this.candidatesLoading.set(false);
    }
  }

  private async apply(status: AppointmentStatus): Promise<void> {
    const { id } = this.appointment();
    if (!id || this.pending()) {
      return;
    }
    const showRecovery = status === 'cancelada' && this.isHighRisk();
    this.pending.set(status);
    try {
      const updated = await firstValueFrom(this.appointments.updateStatus(id, status));
      if (showRecovery) {
        this.cancellationComplete.set(true);
        if (Array.isArray(updated.waitlistCandidates)) {
          this.cancellationCandidates.set(updated.waitlistCandidates);
        } else {
          await this.loadCandidates(id);
        }
      } else if (status === 'cancelada') {
        this.closeConfirm();
      }
      this.toasts.success(SUCCESS_MESSAGES[status]);
    } catch (error) {
      const message = errorMessage(error);
      if (status === 'cancelada') {
        this.cancellationError.set(message);
      } else {
        this.toasts.error(message);
      }
    } finally {
      this.pending.set(null);
    }
  }
}
