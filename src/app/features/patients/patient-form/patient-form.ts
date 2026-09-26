import { Component, inject, input, linkedSignal, output, signal } from '@angular/core';
import { applyWhen, email, form, pattern, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { Button } from '@shared/button/button';
import { FormField } from '@shared/form-field/form-field';
import { Select, SelectOption } from '@shared/select/select';
import { TextInput } from '@shared/text-input/text-input';
import {
  CreatePatientRequest,
  PatientResponse,
  PatientsService,
} from '@features/patients/patients.service';

// Mirrors the backend PHONE_REGEXP (source of truth: CreatePatientRequest).
// Exported for the lead conversion form, which collects the same data.
export const PHONE_PATTERN = /^[+]?[0-9()\- ]{7,20}$/;

export const DOCUMENT_TYPES: ReadonlyArray<SelectOption> = [
  { value: 'CC', label: 'CC' },
  { value: 'TI', label: 'TI' },
  { value: 'CE', label: 'CE' },
  { value: 'PEP', label: 'PEP' },
  { value: 'PPT', label: 'PPT' },
  { value: 'Pasaporte', label: 'Pasaporte' },
  { value: 'Otro', label: 'Otro' },
];

interface PatientFormModel {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  birthDate: string;
  phone: string;
  email: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

const EMPTY_MODEL: PatientFormModel = {
  firstName: '',
  lastName: '',
  documentType: '',
  documentNumber: '',
  birthDate: '',
  phone: '',
  email: '',
  address: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
};

function toFormModel(patient: PatientResponse | null): PatientFormModel {
  if (!patient) {
    return { ...EMPTY_MODEL };
  }
  return {
    firstName: patient.firstName ?? '',
    lastName: patient.lastName ?? '',
    documentType: patient.documentType ?? '',
    documentNumber: patient.documentNumber ?? '',
    birthDate: patient.birthDate ?? '',
    phone: patient.phone ?? '',
    email: patient.email ?? '',
    address: patient.address ?? '',
    emergencyContactName: patient.emergencyContactName ?? '',
    emergencyContactPhone: patient.emergencyContactPhone ?? '',
  };
}

@Component({
  selector: 'app-patient-form',
  imports: [Button, FormField, Select, TextInput],
  templateUrl: './patient-form.html',
})
export class PatientForm {
  readonly patient = input<PatientResponse | null>(null);
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  private readonly patients = inject(PatientsService);

  readonly model = linkedSignal(() => toFormModel(this.patient()));
  readonly documentTypes = DOCUMENT_TYPES;
  readonly saving = signal(false);
  readonly serverError = signal<string | null>(null);

  readonly patientForm = form(this.model, (schema) => {
    required(schema.firstName, { message: 'El nombre es obligatorio' });
    required(schema.lastName, { message: 'El apellido es obligatorio' });
    applyWhen(
      schema.email,
      ({ value }) => value() !== '',
      (emailPath) => {
        email(emailPath, { message: 'Ingresa un correo válido' });
      },
    );
    applyWhen(
      schema.phone,
      ({ value }) => value() !== '',
      (phonePath) => {
        pattern(phonePath, PHONE_PATTERN, { message: 'Ingresa un teléfono válido' });
      },
    );
    applyWhen(
      schema.emergencyContactPhone,
      ({ value }) => value() !== '',
      (phonePath) => {
        pattern(phonePath, PHONE_PATTERN, { message: 'Ingresa un teléfono válido' });
      },
    );
  });

  submitPatient(): void {
    this.serverError.set(null);
    submit(this.patientForm, async () => {
      this.saving.set(true);
      try {
        const patient = this.patient();
        if (patient?.id) {
          await firstValueFrom(this.patients.update(patient.id, this.payload()));
        } else {
          await firstValueFrom(this.patients.create(this.payload()));
        }
        this.saved.emit();
      } catch {
        this.serverError.set('No pudimos guardar el paciente. Intenta de nuevo.');
      } finally {
        this.saving.set(false);
      }
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }

  private payload(): CreatePatientRequest {
    const model = this.model();
    const clean = (value: string): string | undefined => (value === '' ? undefined : value);
    return {
      firstName: model.firstName,
      lastName: model.lastName,
      documentType: clean(model.documentType),
      documentNumber: clean(model.documentNumber),
      birthDate: clean(model.birthDate),
      phone: clean(model.phone),
      email: clean(model.email),
      address: clean(model.address),
      emergencyContactName: clean(model.emergencyContactName),
      emergencyContactPhone: clean(model.emergencyContactPhone),
    };
  }
}
