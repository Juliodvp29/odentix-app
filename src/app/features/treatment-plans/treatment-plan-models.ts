import { components } from '@core/api/schema';

export type TreatmentPlanResponse = components['schemas']['TreatmentPlanResponse'];
export type TreatmentPlanItemResponse = components['schemas']['TreatmentPlanItemResponse'];
export type CreateTreatmentPlanRequest = components['schemas']['CreateTreatmentPlanRequest'];
export type CreateTreatmentPlanItemRequest =
  components['schemas']['CreateTreatmentPlanItemRequest'];
export type UpdateTreatmentPlanRequest = components['schemas']['UpdateTreatmentPlanRequest'];

export type TreatmentPlanStatus = NonNullable<TreatmentPlanResponse['status']>;

export interface StatusMeta {
  readonly label: string;
  readonly bgClass: string;
  readonly textClass: string;
  readonly borderClass: string;
}

export const STATUS_META: Record<TreatmentPlanStatus, StatusMeta> = {
  borrador: {
    label: 'Borrador',
    bgClass: 'bg-[var(--color-surface-alt)]',
    textClass: 'text-[var(--color-mid-gray)]',
    borderClass: 'border-[var(--color-hairline)]',
  },
  presentado: {
    label: 'Presentado',
    bgClass: 'bg-[var(--color-info-soft)]',
    textClass: 'text-[var(--color-info-deep)]',
    borderClass: 'border-[var(--color-info)]',
  },
  en_decision: {
    label: 'En decisión',
    bgClass: 'bg-[var(--color-warning-soft)]',
    textClass: 'text-[var(--color-warning-deep)]',
    borderClass: 'border-[var(--color-warning)]',
  },
  aceptado: {
    label: 'Aceptado',
    bgClass: 'bg-[var(--color-success-soft)]',
    textClass: 'text-[var(--color-success-deep)]',
    borderClass: 'border-[var(--color-success)]',
  },
  en_ejecucion: {
    label: 'En ejecución',
    bgClass: 'bg-[var(--color-teal-soft)]',
    textClass: 'text-[var(--color-teal-deep)]',
    borderClass: 'border-[var(--color-teal)]',
  },
  completado: {
    label: 'Completado',
    bgClass: 'bg-[var(--color-success-soft)]',
    textClass: 'text-[var(--color-success-deep)]',
    borderClass: 'border-[var(--color-success)]',
  },
  rechazado: {
    label: 'Rechazado',
    bgClass: 'bg-[var(--color-danger-soft)]',
    textClass: 'text-[var(--color-danger-deep)]',
    borderClass: 'border-[var(--color-danger)]',
  },
  pospuesto: {
    label: 'Pospuesto',
    bgClass: 'bg-[var(--color-warning-soft)]',
    textClass: 'text-[var(--color-warning-deep)]',
    borderClass: 'border-[var(--color-warning)]',
  },
  abandonado: {
    label: 'Abandonado',
    bgClass: 'bg-[var(--color-surface-alt)]',
    textClass: 'text-[var(--color-mid-gray)]',
    borderClass: 'border-[var(--color-hairline)]',
  },
};

export interface ProcedurePreset {
  readonly id: string;
  readonly name: string;
  readonly defaultPriceCop: number;
}

export const COMMON_PROCEDURES: ReadonlyArray<ProcedurePreset> = [
  { id: 'proc-profilaxis', name: 'Profilaxis y limpieza profunda', defaultPriceCop: 90000 },
  { id: 'proc-resina', name: 'Restauración en resina compuesta', defaultPriceCop: 130000 },
  { id: 'proc-endo-uni', name: 'Endodoncia unirradicular', defaultPriceCop: 380000 },
  { id: 'proc-endo-multi', name: 'Endodoncia multirradicular', defaultPriceCop: 520000 },
  { id: 'proc-corona', name: 'Corona en porcelana / zirconio', defaultPriceCop: 850000 },
  { id: 'proc-exodoncia', name: 'Exodoncia dental simple', defaultPriceCop: 110000 },
  { id: 'proc-cordal', name: 'Cirugía de cordal (tercer molar)', defaultPriceCop: 280000 },
  { id: 'proc-blanqueamiento', name: 'Blanqueamiento dental clínico', defaultPriceCop: 450000 },
  { id: 'proc-implante', name: 'Fase quirúrgica implante dental', defaultPriceCop: 2200000 },
  { id: 'proc-detartraje', name: 'Detartraje supragingival', defaultPriceCop: 140000 },
  { id: 'proc-otro', name: 'Otro procedimiento clínico', defaultPriceCop: 0 },
];

export interface ToothOption {
  readonly value: number | null;
  readonly label: string;
}

const FDI_TEETH: ReadonlyArray<number> = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38,
];

export const TOOTH_OPTIONS: ReadonlyArray<ToothOption> = [
  { value: null, label: 'General (Toda la boca)' },
  ...FDI_TEETH.map((tooth) => ({
    value: tooth,
    label: `Pieza ${tooth}`,
  })),
];

export function formatCop(amount: number | null | undefined): string {
  const safe = Number(amount ?? 0);
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(safe) ? safe : 0);
}

export function calculateItemNetPrice(priceCop: number, discountCop: number = 0): number {
  const price = Math.max(0, priceCop || 0);
  const discount = Math.max(0, discountCop || 0);
  return Math.max(0, price - discount);
}

export interface PlanTotals {
  readonly gross: number;
  readonly discount: number;
  readonly net: number;
}

export function calculatePlanTotals(
  items: ReadonlyArray<{ priceCop: number; discountCop?: number }>,
): PlanTotals {
  let gross = 0;
  let discount = 0;

  for (const item of items) {
    const p = Math.max(0, Number(item.priceCop) || 0);
    const d = Math.max(0, Number(item.discountCop) || 0);
    gross += p;
    discount += Math.min(p, d);
  }

  return {
    gross,
    discount,
    net: Math.max(0, gross - discount),
  };
}
