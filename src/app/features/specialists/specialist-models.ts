import { components } from '@core/api/schema';

export type SpecialistResponse = components['schemas']['SpecialistResponse'];
export type CreateSpecialistRequest = components['schemas']['CreateSpecialistRequest'];
export type SettlementResponse = components['schemas']['SettlementResponse'];
export type SettlementBreakdownResponse =
  components['schemas']['SettlementBreakdownResponse'];
export type SettlementBreakdownLineResponse =
  components['schemas']['SettlementBreakdownLineResponse'];
export type CreateSettlementRequest = components['schemas']['CreateSettlementRequest'];

export type SettlementStatus = NonNullable<SettlementResponse['status']>;

export interface SettlementStatusMeta {
  readonly label: string;
  readonly bgClass: string;
  readonly textClass: string;
}

// A settlement is either awaiting payment or paid.
export const SETTLEMENT_STATUS_META: Record<SettlementStatus, SettlementStatusMeta> = {
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
};

// Local preview of the backend formula: gross × fee % / 100.
export function previewFeeAmount(grossCop: number, feePercentage: number): number {
  const gross = Math.max(0, Number(grossCop) || 0);
  const fee = Math.min(100, Math.max(0, Number(feePercentage) || 0));
  return Math.round(((gross * fee) / 100) * 100) / 100;
}

export function sumBreakdownLines(
  lines: ReadonlyArray<{ totalCop?: number | null }>,
): number {
  return lines.reduce((sum, line) => sum + Math.max(0, Number(line.totalCop) || 0), 0);
}

// Initials for the specialist avatar (initials-only per the design system).
export function specialistInitials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '—';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
