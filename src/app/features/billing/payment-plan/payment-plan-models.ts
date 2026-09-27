import { components } from '@core/api/schema';

export type PaymentPlanResponse = components['schemas']['PaymentPlanResponse'];
export type InstallmentResponse = components['schemas']['InstallmentResponse'];
export type CreatePaymentPlanRequest = components['schemas']['CreatePaymentPlanRequest'];

export type InstallmentStatus = NonNullable<InstallmentResponse['status']>;

export interface InstallmentStatusMeta {
  readonly label: string;
  readonly bgClass: string;
  readonly textClass: string;
}

// Approved mapping, same semantics as invoices: pendiente → Warning,
// pagada → Success, vencida → Danger.
export const INSTALLMENT_STATUS_META: Record<InstallmentStatus, InstallmentStatusMeta> = {
  pendiente: {
    label: 'Pendiente',
    bgClass: 'bg-warning-soft',
    textClass: 'text-warning-deep',
  },
  pagada: {
    label: 'Pagada',
    bgClass: 'bg-success-soft',
    textClass: 'text-success-deep',
  },
  vencida: {
    label: 'Vencida',
    bgClass: 'bg-danger-soft',
    textClass: 'text-danger-deep',
  },
};

// Preview of the backend split in integer cents: equal shares rounded
// half-up, the last installment absorbing the remainder so the sum closes.
export function previewInstallments(totalCop: number, count: number): number[] {
  const safeTotal = Math.max(0, Math.round(Number(totalCop) || 0));
  const safeCount = Math.floor(Number(count) || 0);
  if (safeTotal <= 0 || safeCount < 1) {
    return [];
  }
  const base = Math.round(safeTotal / safeCount);
  const amounts: number[] = [];
  for (let index = 1; index < safeCount; index += 1) {
    amounts.push(base);
  }
  amounts.push(safeTotal - base * (safeCount - 1));
  return amounts;
}

export function sumInstallments(
  installments: ReadonlyArray<{ amountCop?: number | null }>,
): number {
  return installments.reduce((sum, item) => sum + Math.max(0, Number(item.amountCop) || 0), 0);
}

export function isPaidInstallment(status: InstallmentStatus | string | null | undefined): boolean {
  return status === 'pagada';
}

export function canPayInstallment(status: InstallmentStatus | string | null | undefined): boolean {
  return status === 'pendiente' || status === 'vencida';
}
