import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { form, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { AppointmentResponse } from '../../appointments.service';
import { Button } from '@shared/button/button';
import { FormField } from '@shared/form-field/form-field';
import { TextInput } from '@shared/text-input/text-input';
import {
  ConvertWaitlistEntryRequest,
  WaitlistEntryResponse,
  WaitlistService,
} from '../waitlist.service';

const scheduleFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Bogota',
});

function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { message?: unknown; error?: unknown } | null;
    if (typeof body?.message === 'string') {
      return body.message;
    }
    if (typeof body?.error === 'string') {
      return body.error;
    }
    if (error.status === 409) {
      return 'La entrada ya no es compatible con ese horario.';
    }
  }
  return 'No pudimos convertir la entrada. Intenta de nuevo.';
}

@Component({
  selector: 'app-waitlist-convert-dialog',
  imports: [Button, FormField, TextInput],
  templateUrl: './waitlist-convert-dialog.html',
  host: { class: 'block' },
})
export class WaitlistConvertDialog {
  readonly entry = input.required<WaitlistEntryResponse>();
  readonly sourceAppointmentId = input.required<string>();
  readonly sourceStartsAt = input<string | undefined>(undefined);
  readonly sourceEndsAt = input<string | undefined>(undefined);
  readonly converted = output<AppointmentResponse>();
  readonly cancelled = output<void>();

  private readonly waitlist = inject(WaitlistService);
  readonly notesModel = signal({ notes: '' });
  readonly notesForm = form(this.notesModel);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly patientName = computed(() => this.entry().patientName || 'Paciente sin nombre');
  readonly schedule = computed(() => {
    const from = this.format(this.sourceStartsAt());
    const to = this.format(this.sourceEndsAt());
    if (from && to) {
      return `${from} – ${to}`;
    }
    return from || to || 'Horario de la cita cancelada';
  });

  confirm(): void {
    if (this.saving()) {
      return;
    }
    submit(this.notesForm, () => this.save());
  }

  cancel(): void {
    if (!this.saving()) {
      this.cancelled.emit();
    }
  }

  private async save(): Promise<void> {
    const entryId = this.entry().id;
    if (!entryId) {
      this.error.set('No pudimos identificar la entrada.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const body: ConvertWaitlistEntryRequest = {
      sourceAppointmentId: this.sourceAppointmentId(),
      ...(this.notesModel().notes.trim() ? { notes: this.notesModel().notes.trim() } : {}),
    };
    try {
      const appointment = await firstValueFrom(this.waitlist.convert(entryId, body));
      this.converted.emit(appointment);
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  private format(value: string | undefined): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : scheduleFormatter.format(date);
  }
}
