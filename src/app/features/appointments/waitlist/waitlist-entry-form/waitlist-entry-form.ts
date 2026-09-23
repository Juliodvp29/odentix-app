import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, linkedSignal, output, signal } from '@angular/core';
import { form, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { Button } from '@shared/button/button';
import { FormField } from '@shared/form-field/form-field';
import { TextInput } from '@shared/text-input/text-input';
import { AppointmentResponse } from '../../appointments.service';
import { toBackendInstant, toDateTimeLocalBogota } from '../../agenda-dates';
import { CreateWaitlistEntryRequest, WaitlistService } from '../waitlist.service';

interface WaitlistFormModel {
  patientId: string;
  desiredFrom: string;
  desiredTo: string;
}

function toFormModel(appointment: AppointmentResponse): WaitlistFormModel {
  return {
    patientId: appointment.patientId ?? '',
    desiredFrom: toDateTimeLocalBogota(appointment.startsAt),
    desiredTo: toDateTimeLocalBogota(appointment.endsAt),
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 403) {
      return 'No tienes permiso para registrar pacientes en lista de espera.';
    }
    const body = error.error as { message?: unknown; error?: unknown } | null;
    if (typeof body?.message === 'string') {
      return body.message;
    }
    if (typeof body?.error === 'string') {
      return body.error;
    }
  }
  return 'No pudimos registrar al paciente. Intenta de nuevo.';
}

@Component({
  selector: 'app-waitlist-entry-form',
  imports: [Button, FormField, TextInput],
  templateUrl: './waitlist-entry-form.html',
  host: { class: 'block' },
})
export class WaitlistEntryForm {
  readonly appointment = input.required<AppointmentResponse>();
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  private readonly waitlist = inject(WaitlistService);

  readonly model = linkedSignal(() => toFormModel(this.appointment()));
  readonly waitlistForm = form(this.model, (schema) => {
    required(schema.patientId, { message: 'El paciente es obligatorio.' });
  });
  readonly saving = signal(false);
  readonly rangeError = signal<string | null>(null);
  readonly serverError = signal<string | null>(null);

  submitWaitlist(): void {
    this.rangeError.set(null);
    this.serverError.set(null);
    submit(this.waitlistForm, () => this.save());
  }

  cancel(): void {
    if (!this.saving()) {
      this.cancelled.emit();
    }
  }

  private async save(): Promise<void> {
    const model = this.model();
    if (model.desiredFrom && model.desiredTo && model.desiredTo <= model.desiredFrom) {
      this.rangeError.set('La fecha final debe ser posterior a la inicial.');
      return;
    }

    this.saving.set(true);
    try {
      const body: CreateWaitlistEntryRequest = {
        patientId: model.patientId,
        desiredFrom: model.desiredFrom ? toBackendInstant(model.desiredFrom) : undefined,
        desiredTo: model.desiredTo ? toBackendInstant(model.desiredTo) : undefined,
      };
      const created = await firstValueFrom(this.waitlist.addEntry(body));
      if (!created) {
        throw new Error('Empty response');
      }
      this.saved.emit();
    } catch (error) {
      this.serverError.set(errorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }
}
