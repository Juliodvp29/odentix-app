import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { form, max, min, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { formatCop } from '@features/treatment-plans/treatment-plan-models';
import type { TreatmentPlanResponse } from '@features/treatment-plans/treatment-plan-models';
import { Button } from '@shared/button/button';
import { FormField } from '@shared/form-field/form-field';
import { TextInput } from '@shared/text-input/text-input';
import {
  CreatePaymentPlanRequest,
  PaymentPlanResponse,
  previewInstallments,
} from '../payment-plan-models';
import { PaymentPlansService } from '../payment-plans.service';

interface PaymentPlanFormModel {
  totalAmountCop: number;
  installmentsCount: number;
}

function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 409) {
      return 'El plan de tratamiento ya tiene un plan de pago activo.';
    }
    const body = error.error as { message?: unknown; error?: unknown } | null;
    if (typeof body?.message === 'string') {
      return body.message;
    }
    if (typeof body?.error === 'string') {
      return body.error;
    }
  }
  return 'No pudimos crear el plan de pago. Intenta de nuevo.';
}

function asNumber(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

@Component({
  selector: 'app-payment-plan-create-form',
  imports: [Button, FormField, TextInput],
  templateUrl: './payment-plan-create-form.html',
  host: { class: 'block' },
})
export class PaymentPlanCreateForm {
  readonly treatmentPlan = input.required<TreatmentPlanResponse>();
  readonly created = output<PaymentPlanResponse>();
  readonly alreadyExists = output<void>();
  readonly cancelled = output<void>();

  private readonly paymentPlans = inject(PaymentPlansService);

  readonly model = linkedSignal<PaymentPlanFormModel>(() => ({
    totalAmountCop: Math.max(0, Number(this.treatmentPlan().totalPriceCop) || 0),
    installmentsCount: 3,
  }));
  readonly planForm = form(this.model, (schema) => {
    min(schema.totalAmountCop, 1, { message: 'El monto total debe ser mayor a cero.' });
    min(schema.installmentsCount, 1, { message: 'Debe haber al menos 1 cuota.' });
    max(schema.installmentsCount, 60, { message: 'El número de cuotas no puede exceder 60.' });
  });
  readonly saving = signal(false);
  readonly rangeError = signal<string | null>(null);
  readonly serverError = signal<string | null>(null);

  readonly effectiveTotal = computed(() => Math.max(0, asNumber(this.model().totalAmountCop)));
  readonly effectiveCount = computed(() => Math.floor(asNumber(this.model().installmentsCount)));
  readonly preview = computed(() =>
    previewInstallments(this.effectiveTotal(), this.effectiveCount()),
  );

  formatPrice(val: number | null | undefined): string {
    return formatCop(val);
  }

  submitPlan(): void {
    this.rangeError.set(null);
    this.serverError.set(null);
    submit(this.planForm, () => this.save());
  }

  cancel(): void {
    if (!this.saving()) {
      this.cancelled.emit();
    }
  }

  private async save(): Promise<void> {
    const total = this.effectiveTotal();
    const count = this.effectiveCount();
    if (total <= 0) {
      this.rangeError.set('El monto total debe ser mayor a cero.');
      return;
    }
    if (count < 1 || count > 60) {
      this.rangeError.set('El número de cuotas debe estar entre 1 y 60.');
      return;
    }

    const treatmentPlanId = this.treatmentPlan().id;
    if (!treatmentPlanId) {
      return;
    }
    const body: CreatePaymentPlanRequest = { totalAmountCop: total, installmentsCount: count };
    this.saving.set(true);
    try {
      const plan = await firstValueFrom(
        this.paymentPlans.createPaymentPlan(treatmentPlanId, body),
      );
      if (!plan) {
        throw new Error('Empty response');
      }
      this.created.emit(plan);
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
