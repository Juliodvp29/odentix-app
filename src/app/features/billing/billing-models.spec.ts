import { describe, expect, it } from 'vitest';
import {
  INVOICE_STATUS_META,
  InvoiceResponse,
  defaultDiscountFromPlan,
  describePlanItem,
  invoiceComputedTotal,
  previewLinesFromPlan,
  sumLines,
} from './billing-models';
import type { TreatmentPlanItemResponse } from '@features/treatment-plans/treatment-plan-models';

const PLAN_ITEMS: TreatmentPlanItemResponse[] = [
  { id: 'item-1', toothNumber: 16, priceCop: 400000, discountCop: 20000, netPriceCop: 380000 },
  { id: 'item-2', toothNumber: undefined, priceCop: 140000, discountCop: 0, netPriceCop: 140000 },
];

describe('invoice status meta', () => {
  it('should follow the DESIGN.md invoice color mapping', () => {
    expect(INVOICE_STATUS_META.pagada.textClass).toContain('success');
    expect(INVOICE_STATUS_META.pendiente.textClass).toContain('warning');
    expect(INVOICE_STATUS_META.parcial.textClass).toContain('info');
    expect(INVOICE_STATUS_META.anulada.textClass).toContain('danger');
  });

  it('should label every status in Spanish', () => {
    expect(INVOICE_STATUS_META.pendiente.label).toBe('Pendiente');
    expect(INVOICE_STATUS_META.parcial.label).toBe('Parcial');
    expect(INVOICE_STATUS_META.pagada.label).toBe('Pagada');
    expect(INVOICE_STATUS_META.anulada.label).toBe('Anulada');
  });
});

describe('plan invoice preview', () => {
  it('should describe lines like the backend does', () => {
    expect(describePlanItem(16)).toBe('Tratamiento pieza 16');
    expect(describePlanItem(null)).toBe('Procedimiento del plan');
  });

  it('should infer one gross-priced line per plan item', () => {
    const lines = previewLinesFromPlan(PLAN_ITEMS);
    expect(lines).toEqual([
      { description: 'Tratamiento pieza 16', quantity: 1, unitPriceCop: 400000, totalCop: 400000 },
      { description: 'Procedimiento del plan', quantity: 1, unitPriceCop: 140000, totalCop: 140000 },
    ]);
  });

  it('should default the discount to the sum of plan discounts', () => {
    expect(defaultDiscountFromPlan(PLAN_ITEMS)).toBe(20000);
  });
});

describe('invoice totals', () => {
  it('should sum line totals with quantity and unit price', () => {
    expect(
      sumLines([
        { quantity: 2, unitPriceCop: 50000 },
        { quantity: 1, unitPriceCop: 40000 },
      ]),
    ).toBe(140000);
  });

  it('should compute the total as subtotal minus discount', () => {
    expect(invoiceComputedTotal(540000, 20000)).toBe(520000);
    expect(invoiceComputedTotal(100000, 100000)).toBe(0);
  });

  it('should reconcile a realistic invoice: total matches its visible lines', () => {
    const invoice: InvoiceResponse = {
      id: 'inv-1',
      invoiceNumber: 'FAC-000001',
      status: 'pendiente',
      subtotalCop: 540000,
      discountCop: 20000,
      totalCop: 520000,
      items: [
        { id: 'i-1', description: 'Tratamiento pieza 16', quantity: 1, unitPriceCop: 400000, totalCop: 400000 },
        { id: 'i-2', description: 'Procedimiento del plan', quantity: 1, unitPriceCop: 140000, totalCop: 140000 },
      ],
    };
    const lines = invoice.items ?? [];
    expect(sumLines(lines)).toBe(invoice.subtotalCop);
    expect(invoiceComputedTotal(sumLines(lines), invoice.discountCop ?? 0)).toBe(invoice.totalCop);
  });
});
