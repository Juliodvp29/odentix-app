import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, required, submit } from '@angular/forms/signals';
import { debounceTime, firstValueFrom, of } from 'rxjs';
import { Button } from '@shared/button/button';
import { FormField } from '@shared/form-field/form-field';
import { Select, SelectOption } from '@shared/select/select';
import { TextInput } from '@shared/text-input/text-input';
import {
  AppointmentResponse,
  AppointmentsService,
  CreateAppointmentRequest,
} from '../../appointments.service';
import { toBackendInstant } from '../../agenda-dates';
import { PatientResponse, PatientsService } from '@features/patients/patients.service';

const RISK_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 'bajo', label: 'Bajo' },
  { value: 'medio', label: 'Medio' },
  { value: 'alto', label: 'Alto' },
];

// Modal form to schedule an appointment.
@Component({
  selector: 'app-appointment-form',
  imports: [Button, FormField, Select, TextInput],
  templateUrl: './appointment-form.html',
  host: { class: 'block' },
})
export class AppointmentForm {
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  private readonly agenda = inject(AppointmentsService);
  private readonly patients = inject(PatientsService);

  readonly patientSearch = signal('');
  readonly patientResults = rxResource({
    params: () => this.patientSearch(),
    stream: ({ params: query }) =>
      query.trim() === ''
        ? of([])
        : this.patients.searchPatients(query.trim()).pipe(debounceTime(250)),
  });
  readonly selectedPatient = signal<PatientResponse | null>(null);

  readonly formModel = signal({
    patientId: '',
    professionalId: '',
    roomId: '',
    startsAt: '',
    endsAt: '',
    riskLevel: '',
    estimatedValueCop: '',
    notes: '',
  });
  readonly appointmentForm = form(this.formModel, (schema) => {
    required(schema.patientId, { message: 'Elige un paciente.' });
    required(schema.startsAt, { message: 'Indica el inicio.' });
    required(schema.endsAt, { message: 'Indica el fin.' });
  });

  readonly professionalSelectOptions = computed<SelectOption[]>(() =>
    this.agenda
      .professionalOptions()
      .map((professional) => ({ value: professional.id, label: professional.name })),
  );
  readonly roomSelectOptions = computed<SelectOption[]>(() =>
    this.agenda.roomOptions().map((room) => ({ value: room.id, label: room.name })),
  );
  readonly riskSelectOptions = RISK_OPTIONS;

  readonly saving = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly rangeError = signal<string | null>(null);

  onPatientSearch(event: Event): void {
    this.patientSearch.set((event.target as HTMLInputElement).value);
  }

  pickPatient(patient: PatientResponse): void {
    this.selectedPatient.set(patient);
    this.formModel.update((model) => ({ ...model, patientId: patient.id ?? '' }));
    this.patientSearch.set('');
  }

  clearPatient(): void {
    this.selectedPatient.set(null);
    this.formModel.update((model) => ({ ...model, patientId: '' }));
  }

  patientName(patient: PatientResponse): string {
    return `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim() || 'Sin nombre';
  }

  submitAppointment(): void {
    submit(this.appointmentForm, () => this.save());
  }

  private async save(): Promise<void> {
    const model = this.formModel();
    if (model.endsAt <= model.startsAt) {
      this.rangeError.set('La hora de fin debe ser posterior al inicio.');
      return;
    }
    this.rangeError.set(null);
    this.serverError.set(null);
    this.saving.set(true);
    try {
      const estimated = Number(model.estimatedValueCop);
      const body: CreateAppointmentRequest = {
        patientId: model.patientId,
        professionalId: model.professionalId || undefined,
        roomId: model.roomId || undefined,
        startsAt: toBackendInstant(model.startsAt),
        endsAt: toBackendInstant(model.endsAt),
        riskLevel:
          model.riskLevel === ''
            ? undefined
            : (model.riskLevel as NonNullable<CreateAppointmentRequest['riskLevel']>),
        estimatedValueCop:
          model.estimatedValueCop.trim() === '' || Number.isNaN(estimated) ? undefined : estimated,
        notes: model.notes.trim() || undefined,
      };
      const created: AppointmentResponse = await firstValueFrom(
        this.agenda.createAppointment(body),
      );
      if (!created) {
        throw new Error('Empty response');
      }
      this.saved.emit();
    } catch (error) {
      this.serverError.set(
        error instanceof HttpErrorResponse && error.status === 409
          ? 'Ese horario se cruza con otra cita del profesional. Elige otro horario.'
          : 'No pudimos agendar la cita. Intenta de nuevo.',
      );
    } finally {
      this.saving.set(false);
    }
  }
}
