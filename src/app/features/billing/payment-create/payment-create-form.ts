import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { form, min, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { Button } from '@shared/button/button';
import { FormField } from '@shared/form-field/form-field';
import { Select } from '@shared/select/select';
import { TextInput } from '@shared/text-input/text-input';
import {
  CreatePaymentRequest,
  InvoiceResponse,
  PAYMENT_METHOD_OPTIONS,
  PaymentMethod,
  PaymentResponse,
} from '../billing-models';
import { InvoicesService } from '../invoices.service';

interface PaymentFormModel {
  amountCop: number;
  method: string;
  reference: string;
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
  return 'No pudimos registrar el pago. Intenta de nuevo.';
}

@Component({
  selector: 'app-payment-create-form',
  imports: [Button, FormField, Select, TextInput],
  templateUrl: './payment-create-form.html',
  host: { class: 'block' },
})
export class PaymentCreateForm {
  readonly invoice = input.required<InvoiceResponse>();
  readonly paid = output<PaymentResponse>();
  readonly cancelled = output<void>();

  private readonly invoices = inject(InvoicesService);

  readonly methodOptions = PAYMENT_METHOD_OPTIONS;

  // Prefilling the full total covers the most common case; the cashier
  // adjusts down for partial payments.
  readonly model = linkedSignal<PaymentFormModel>(() => ({
    amountCop: Math.max(0, Number(this.invoice().totalCop) || 0),
    method: '',
    reference: '',
  }));
  readonly paymentForm = form(this.model, (schema) => {
    min(schema.amountCop, 0, { message: 'El monto no puede ser negativo.' });
    required(schema.method, { message: 'El medio de pago es obligatorio.' });
  });
  readonly saving = signal(false);
  readonly amountError = signal<string | null>(null);
  readonly serverError = signal<string | null>(null);

  // A cleared field counts as zero, which the submit handler rejects;
  // NaN never reaches the backend.
  readonly effectiveAmount = computed(() => {
    const raw = this.model().amountCop;
    return typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
  });

  submitPayment(): void {
    this.amountError.set(null);
    this.serverError.set(null);
    submit(this.paymentForm, () => this.save());
  }

  cancel(): void {
    if (!this.saving()) {
      this.cancelled.emit();
    }
  }

  private async save(): Promise<void> {
    if (this.effectiveAmount() <= 0) {
      this.amountError.set('El monto debe ser mayor que cero.');
      return;
    }

    const { id } = this.invoice();
    if (!id) {
      return;
    }
    const model = this.model();
    const body: CreatePaymentRequest = {
      amountCop: this.effectiveAmount(),
      method: model.method as PaymentMethod,
    };
    if (model.reference.trim()) {
      body.reference = model.reference.trim();
    }
    this.saving.set(true);
    try {
      const payment = await firstValueFrom(this.invoices.registerPayment(id, body));
      if (!payment) {
        throw new Error('Empty response');
      }
      this.paid.emit(payment);
    } catch (error) {
      this.serverError.set(errorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }
}
