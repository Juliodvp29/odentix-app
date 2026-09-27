import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, output, signal } from '@angular/core';
import { form, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { Button } from '@shared/button/button';
import { FormField } from '@shared/form-field/form-field';
import { TextInput } from '@shared/text-input/text-input';
import { CreateSettlementRequest, SettlementResponse } from '../specialist-models';
import { SettlementsService } from '../settlements.service';

interface SettlementFormModel {
  periodStart: string;
  periodEnd: string;
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
  return 'No pudimos generar la liquidación. Intenta de nuevo.';
}

@Component({
  selector: 'app-settlement-generate-form',
  imports: [Button, FormField, TextInput],
  templateUrl: './settlement-generate-form.html',
  host: { class: 'block' },
})
export class SettlementGenerateForm {
  readonly specialistId = input.required<string>();
  readonly generated = output<SettlementResponse>();
  readonly alreadyExists = output<void>();
  readonly cancelled = output<void>();

  private readonly settlements = inject(SettlementsService);

  readonly model = signal<SettlementFormModel>({ periodStart: '', periodEnd: '' });
  readonly settlementForm = form(this.model, (schema) => {
    required(schema.periodStart, { message: 'El inicio del periodo es obligatorio.' });
    required(schema.periodEnd, { message: 'El fin del periodo es obligatorio.' });
  });
  readonly saving = signal(false);
  readonly rangeError = signal<string | null>(null);
  readonly serverError = signal<string | null>(null);

  submitSettlement(): void {
    this.rangeError.set(null);
    this.serverError.set(null);
    submit(this.settlementForm, () => this.save());
  }

  cancel(): void {
    if (!this.saving()) {
      this.cancelled.emit();
    }
  }

  private async save(): Promise<void> {
    const model = this.model();
    if (model.periodEnd < model.periodStart) {
      this.rangeError.set('El fin del periodo no puede ser anterior al inicio.');
      return;
    }
    const specialistId = this.specialistId();
    if (!specialistId) {
      return;
    }
    const body: CreateSettlementRequest = {
      periodStart: model.periodStart,
      periodEnd: model.periodEnd,
    };
    this.saving.set(true);
    try {
      const settlement = await firstValueFrom(
        this.settlements.generateSettlement(specialistId, body),
      );
      if (!settlement) {
        throw new Error('Empty response');
      }
      this.generated.emit(settlement);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 409) {
        this.alreadyExists.emit();
        return;
      }
      this.serverError.set(errorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }
}
