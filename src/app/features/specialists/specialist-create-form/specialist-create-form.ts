import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, output, signal } from '@angular/core';
import { form, max, min, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ProfessionalsService } from '@features/appointments/professionals.service';
import { Button } from '@shared/button/button';
import { FormField } from '@shared/form-field/form-field';
import { TextInput } from '@shared/text-input/text-input';
import { SpecialistResponse } from '../specialist-models';
import { SettlementsService } from '../settlements.service';

interface SpecialistCreateModel {
  fullName: string;
  specialty: string;
  licenseNumber: string;
  feePercentage: number;
  paymentTerms: string;
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
  return 'No pudimos crear el especialista. Intenta de nuevo.';
}

function asNumber(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : NaN;
}

// Owner-only form: creates the external professional first and then
// their financial profile in one flow.
@Component({
  selector: 'app-specialist-create-form',
  imports: [Button, FormField, TextInput],
  templateUrl: './specialist-create-form.html',
  host: { class: 'block' },
})
export class SpecialistCreateForm {
  readonly created = output<SpecialistResponse>();
  readonly cancelled = output<void>();

  private readonly professionals = inject(ProfessionalsService);
  private readonly settlements = inject(SettlementsService);

  readonly model = signal<SpecialistCreateModel>({
    fullName: '',
    specialty: '',
    licenseNumber: '',
    feePercentage: 30,
    paymentTerms: '',
  });
  readonly specialistForm = form(this.model, (schema) => {
    required(schema.fullName, { message: 'El nombre es obligatorio.' });
    required(schema.feePercentage, { message: 'El porcentaje es obligatorio.' });
    min(schema.feePercentage, 0, { message: 'El porcentaje no puede ser negativo.' });
    max(schema.feePercentage, 100, { message: 'El porcentaje no puede superar 100.' });
  });
  readonly saving = signal(false);
  readonly serverError = signal<string | null>(null);

  submitSpecialist(): void {
    this.serverError.set(null);
    submit(this.specialistForm, () => this.save());
  }

  cancel(): void {
    if (!this.saving()) {
      this.cancelled.emit();
    }
  }

  private async save(): Promise<void> {
    const model = this.model();
    const fee = asNumber(model.feePercentage);
    if (!Number.isFinite(fee) || fee < 0 || fee > 100) {
      this.serverError.set('El porcentaje debe estar entre 0 y 100.');
      return;
    }
    const clean = (value: string): string | undefined =>
      value.trim() === '' ? undefined : value.trim();

    this.saving.set(true);
    try {
      const professional = await firstValueFrom(
        this.professionals.createProfessional({
          fullName: model.fullName.trim(),
          specialty: clean(model.specialty),
          licenseNumber: clean(model.licenseNumber),
          isExternal: true,
        }),
      );
      if (!professional?.id) {
        throw new Error('Empty professional response');
      }
      try {
        const profile = await firstValueFrom(
          this.settlements.createSpecialist({
            professionalId: professional.id,
            feePercentage: fee,
            paymentTerms: clean(model.paymentTerms),
          }),
        );
        if (!profile) {
          throw new Error('Empty profile response');
        }
        this.created.emit(profile);
      } catch (profileError) {
        this.serverError.set(
          `El profesional se creó, pero la ficha falló: ${errorMessage(profileError)}`,
        );
      }
    } catch (error) {
      this.serverError.set(errorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }
}
