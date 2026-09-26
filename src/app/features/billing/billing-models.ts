import { components } from '@core/api/schema';
import type { TreatmentPlanItemResponse } from '@features/treatment-plans/treatment-plan-models';

export type InvoiceResponse = components['schemas']['InvoiceResponse'];
export type InvoiceItemResponse = components['schemas']['InvoiceItemResponse'];
export type CreateInvoiceRequest = components['schemas']['CreateInvoiceRequest'];
export type CreatePaymentRequest = components['schemas']['CreatePaymentRequest'];
export type PaymentResponse = components['schemas']['PaymentResponse'];

export type InvoiceStatus = NonNullable<InvoiceResponse['status']>;
export type PaymentMethod = NonNullable<CreatePaymentRequest['method']>;

export interface PaymentMethodOption {
  readonly value: PaymentMethod;
  readonly label: string;
}

export const PAYMENT_METHOD_OPTIONS: ReadonlyArray<PaymentMethodOption> = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'otro', label: 'Otro' },
];

export interface InvoiceStatusMeta {
  readonly label: string;
  readonly bgClass: string;
  readonly textClass: string;
}

// Follows DESIGN.md: pagada → Success, pendiente → Warning,
// parcial → Info, anulada → Danger.
export const INVOICE_STATUS_META: Record<InvoiceStatus, InvoiceStatusMeta> = {
  pendiente: {
    label: 'Pendiente',
    bgClass: 'bg-warning-soft',
    textClass: 'text-warning-deep',
  },
  parcial: {
    label: 'Parcial',
    bgClass: 'bg-info-soft',
    textClass: 'text-info-deep',
  },
  pagada: {
    label: 'Pagada',
    bgClass: 'bg-success-soft',
    textClass: 'text-success-deep',
  },
  anulada: {
    label: 'Anulada',
    bgClass: 'bg-danger-soft',
    textClass: 'text-danger-deep',
  },
};

export interface InvoicePreviewLine {
  readonly description: string;
  readonly quantity: number;
  readonly unitPriceCop: number;
  readonly totalCop: number;
}

// Mirrors the backend's line description for plan-sourced invoices.
export function describePlanItem(toothNumber: number | null | undefined): string {
  return toothNumber ? `Tratamiento pieza ${toothNumber}` : 'Procedimiento del plan';
}

// Lines inferred from a plan mirror the backend: quantity 1 and the
// gross procedure price per line; discounts aggregate separately.
export function previewLinesFromPlan(
  items: ReadonlyArray<TreatmentPlanItemResponse>,
): InvoicePreviewLine[] {
  return items.map((item) => {
    const unit = Math.max(0, Number(item.priceCop) || 0);
    return {
      description: describePlanItem(item.toothNumber),
      quantity: 1,
      unitPriceCop: unit,
      totalCop: unit,
    };
  });
}

// Default invoice discount for a plan: the sum of its item discounts,
// matching the backend when no explicit discount is sent.
export function defaultDiscountFromPlan(
  items: ReadonlyArray<TreatmentPlanItemResponse>,
): number {
  return items.reduce((sum, item) => sum + Math.max(0, Number(item.discountCop) || 0), 0);
}

export function lineTotal(line: {
  quantity?: number | null;
  unitPriceCop?: number | null;
}): number {
  const quantity = Math.max(0, Number(line.quantity ?? 1) || 0);
  const unit = Math.max(0, Number(line.unitPriceCop) || 0);
  return quantity * unit;
}

export function sumLines(
  lines: ReadonlyArray<{ quantity?: number | null; unitPriceCop?: number | null }>,
): number {
  return lines.reduce((sum, line) => sum + lineTotal(line), 0);
}

export function invoiceComputedTotal(subtotalCop: number, discountCop: number): number {
  return Math.max(0, subtotalCop - Math.max(0, discountCop || 0));
}
