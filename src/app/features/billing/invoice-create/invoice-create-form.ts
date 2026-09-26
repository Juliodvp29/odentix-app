import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { form, min, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { formatCop } from '@features/treatment-plans/treatment-plan-models';
import type { TreatmentPlanResponse } from '@features/treatment-plans/treatment-plan-models';
import { Button } from '@shared/button/button';
import { FormField } from '@shared/form-field/form-field';
import { TextInput } from '@shared/text-input/text-input';
import {
  InvoicePreviewLine,
  InvoiceResponse,
  defaultDiscountFromPlan,
  invoiceComputedTotal,
  previewLinesFromPlan,
  sumLines,
} from '../billing-models';
import { InvoicesService } from '../invoices.service';

interface InvoiceDiscountModel {
  discountCop: number;
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
  return 'No pudimos generar la factura. Intenta de nuevo.';
}

@Component({
  selector: 'app-invoice-create-form',
  imports: [Button, FormField, TextInput],
  templateUrl: './invoice-create-form.html',
  host: { class: 'block' },
})
export class InvoiceCreateForm {
  readonly plan = input.required<TreatmentPlanResponse>();
  readonly created = output<InvoiceResponse>();
  readonly cancelled = output<void>();

  private readonly invoices = inject(InvoicesService);

  readonly lines = computed<InvoicePreviewLine[]>(() =>
    previewLinesFromPlan(this.plan().items ?? []),
  );
  readonly subtotal = computed(() => sumLines(this.lines()));
  readonly defaultDiscount = computed(() => defaultDiscountFromPlan(this.plan().items ?? []));

  readonly model = linkedSignal<InvoiceDiscountModel>(() => ({
    discountCop: this.defaultDiscount(),
  }));
  readonly discountForm = form(this.model, (schema) => {
    min(schema.discountCop, 0, { message: 'El descuento no puede ser negativo.' });
  });
  readonly saving = signal(false);
  readonly discountError = signal<string | null>(null);
  readonly serverError = signal<string | null>(null);

  // A cleared field counts as no discount; NaN never reaches the backend.
  readonly effectiveDiscount = computed(() => {
    const raw = this.model().discountCop;
    return typeof raw === 'number' && Number.isFinite(raw) ? Math.max(0, raw) : 0;
  });
  readonly liveTotal = computed(() =>
    invoiceComputedTotal(this.subtotal(), this.effectiveDiscount()),
  );

  formatPrice(val: number | null | undefined): string {
    return formatCop(val);
  }

  submitInvoice(): void {
    this.discountError.set(null);
    this.serverError.set(null);
    submit(this.discountForm, () => this.save());
  }

  cancel(): void {
    if (!this.saving()) {
      this.cancelled.emit();
    }
  }

  private async save(): Promise<void> {
    const discount = this.effectiveDiscount();
    if (discount > this.subtotal()) {
      this.discountError.set('El descuento no puede superar el subtotal.');
      return;
    }

    const planId = this.plan().id;
    if (!planId) {
      return;
    }
    this.saving.set(true);
    try {
      const invoice = await firstValueFrom(this.invoices.createInvoice(planId, discount));
      if (!invoice) {
        throw new Error('Empty response');
      }
      this.created.emit(invoice);
    } catch (error) {
      this.serverError.set(errorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }
}
