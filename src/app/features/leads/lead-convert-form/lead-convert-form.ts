import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, linkedSignal, output, signal } from '@angular/core';
import { applyWhen, email, form, pattern, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import {
  DOCUMENT_TYPES,
  PHONE_PATTERN,
} from '@features/patients/patient-form/patient-form';
import { Button } from '@shared/button/button';
import { FormField } from '@shared/form-field/form-field';
import { Select } from '@shared/select/select';
import { TextInput } from '@shared/text-input/text-input';
import {
  ConvertLeadPatientData,
  ConvertLeadResponse,
  LeadResponse,
  splitLeadName,
} from '../lead-models';
import { LeadsService } from '../leads.service';

interface ConvertFormModel {
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
  return 'No pudimos convertir el prospecto. Intenta de nuevo.';
}

// Same fields, labels, and validation as patient creation, prefilled
// from the lead and posted to the conversion endpoint instead.
@Component({
  selector: 'app-lead-convert-form',
  imports: [Button, FormField, Select, TextInput],
  templateUrl: './lead-convert-form.html',
  host: { class: 'block' },
})
export class LeadConvertForm {
  readonly lead = input.required<LeadResponse>();
  readonly converted = output<ConvertLeadResponse>();
  readonly cancelled = output<void>();

  private readonly leads = inject(LeadsService);

  readonly documentTypes = DOCUMENT_TYPES;

  readonly model = linkedSignal<ConvertFormModel>(() => {
    const lead = this.lead();
    const names = splitLeadName(lead.fullName);
    return {
      firstName: names.firstName,
      lastName: names.lastName,
      documentType: '',
      documentNumber: '',
      birthDate: '',
      phone: lead.phone ?? '',
      email: lead.email ?? '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
    };
  });

  readonly convertForm = form(this.model, (schema) => {
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
  readonly saving = signal(false);
  readonly serverError = signal<string | null>(null);

  submitConversion(): void {
    this.serverError.set(null);
    submit(this.convertForm, () => this.save());
  }

  cancel(): void {
    if (!this.saving()) {
      this.cancelled.emit();
    }
  }

  private async save(): Promise<void> {
    const leadId = this.lead().id;
    if (!leadId) {
      return;
    }
    this.saving.set(true);
    try {
      const converted = await firstValueFrom(this.leads.convertLead(leadId, this.payload()));
      if (!converted) {
        throw new Error('Empty response');
      }
      this.converted.emit(converted);
    } catch (error) {
      this.serverError.set(errorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  private payload(): ConvertLeadPatientData {
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
