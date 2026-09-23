import { Component, TemplateRef, computed, inject, input, viewChild } from '@angular/core';
import { SessionService } from '@core/auth/session.service';
import { Button } from '@shared/button/button';
import { ModalHandle, ModalService } from '@shared/modal/modal.service';
import { ToastService } from '@shared/toast/toast.service';
import { AppointmentResponse } from '../../appointments.service';
import { WaitlistEntryForm } from '../waitlist-entry-form/waitlist-entry-form';

@Component({
  selector: 'app-waitlist-entry-action',
  imports: [Button, WaitlistEntryForm],
  templateUrl: './waitlist-entry-action.html',
  host: { class: 'block' },
})
export class WaitlistEntryAction {
  readonly appointment = input.required<AppointmentResponse>();

  private readonly session = inject(SessionService);
  private readonly modals = inject(ModalService);
  private readonly toasts = inject(ToastService);
  private readonly entryTemplate = viewChild.required<TemplateRef<unknown>>('entryTemplate');
  private dialog: ModalHandle | null = null;

  readonly canRegister = computed(
    () =>
      Boolean(this.appointment().patientId) &&
      this.session.currentUser()?.role !== 'especialista_externo',
  );

  open(): void {
    if (!this.canRegister()) {
      return;
    }
    this.dialog = this.modals.open(this.entryTemplate(), {
      title: 'Añadir a lista de espera',
    });
  }

  onSaved(): void {
    this.close();
    this.toasts.success('Paciente añadido a la lista de espera.');
  }

  onCancelled(): void {
    this.close();
  }

  private close(): void {
    this.dialog?.close();
    this.dialog = null;
  }
}
