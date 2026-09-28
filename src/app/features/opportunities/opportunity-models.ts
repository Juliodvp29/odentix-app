import { formatCurrencyCop } from '@shared/table/table-models';
import { components } from '@core/api/schema';

export type OpportunityResponse = components['schemas']['OpportunityResponse'];
export type OpportunityActionResponse = components['schemas']['OpportunityActionResponse'];
export type UpdateOpportunityStatusRequest =
  components['schemas']['UpdateOpportunityStatusRequest'];

export type OpportunityType = NonNullable<OpportunityResponse['type']>;
export type OpportunityStatus = NonNullable<OpportunityResponse['status']>;
export type OpportunityActionType = NonNullable<OpportunityActionResponse['actionType']>;
export type RecoveredValueResponse = components['schemas']['RecoveredValueResponse'];

export type PriorityTier = 'high' | 'medium' | 'low';
export type OpportunitySegment = 'activas' | 'resuelta' | 'descartada';

export interface OpportunityTypeMeta {
  readonly label: string;
  readonly hint: string;
}

export const OPPORTUNITY_TYPES: ReadonlyArray<OpportunityType> = [
  'lead_sin_respuesta',
  'tratamiento_sin_seguimiento',
  'cita_alto_riesgo',
  'espacio_disponible',
  'paciente_inactivo',
  'saldo_vencido',
  'inventario_critico',
];

export const OPPORTUNITY_TYPE_META: Record<OpportunityType, OpportunityTypeMeta> = {
  lead_sin_respuesta: {
    label: 'Lead sin respuesta',
    hint: 'Un interesado escribió y aún no recibe respuesta.',
  },
  tratamiento_sin_seguimiento: {
    label: 'Tratamiento sin seguimiento',
    hint: 'Un plan presentado sigue sin decisión del paciente.',
  },
  cita_alto_riesgo: {
    label: 'Cita en riesgo',
    hint: 'Una cita con alta probabilidad de inasistencia.',
  },
  espacio_disponible: {
    label: 'Espacio disponible',
    hint: 'Un hueco de agenda que se puede llenar hoy.',
  },
  paciente_inactivo: {
    label: 'Paciente inactivo',
    hint: 'Un paciente que hace tiempo no agenda control.',
  },
  saldo_vencido: {
    label: 'Saldo vencido',
    hint: 'Un saldo por cobrar que ya venció.',
  },
  inventario_critico: {
    label: 'Inventario crítico',
    hint: 'Un insumo por debajo de su nivel mínimo.',
  },
};

export interface OpportunityGroup {
  readonly type: OpportunityType;
  readonly label: string;
  readonly hint: string;
  readonly items: ReadonlyArray<OpportunityResponse>;
  readonly groupValue: number;
}

// Thresholds mirror the backend mapping from opportunity priority to
// task priority: 4+ becomes alta, 3 media, below that baja.
export function priorityTier(priority: number | null | undefined): PriorityTier {
  if ((priority ?? 0) >= 4) {
    return 'high';
  }
  if ((priority ?? 0) === 3) {
    return 'medium';
  }
  return 'low';
}

export function isActiveOpportunity(opportunity: Pick<OpportunityResponse, 'status'>): boolean {
  return opportunity.status === 'abierta' || opportunity.status === 'en_progreso';
}

// The suggested message carries the human title on its first line
// (the schema has no title column); the rest is the description.
export function opportunityTitle(opportunity: Pick<OpportunityResponse, 'actions'>): string {
  const first = opportunity.actions?.[0]?.suggestedMessage ?? '';
  const title = first.split('\n', 2)[0]?.trim() ?? '';
  return title || 'Oportunidad detectada';
}

export function opportunityValue(
  opportunity: Pick<OpportunityResponse, 'estimatedValueCop'>,
): number {
  return Number(opportunity.estimatedValueCop ?? 0);
}

export function valueLabel(value: number | null | undefined): string {
  return formatCurrencyCop(Number(value ?? 0));
}

export function actionTypeLabel(actionType: OpportunityActionType | null | undefined): string {
  if (actionType === 'crear_tarea') {
    return 'Crear tarea';
  }
  if (actionType === 'enviar_mensaje') {
    return 'Enviar mensaje';
  }
  return 'Sin acción sugerida';
}

function compareOpportunities(a: OpportunityResponse, b: OpportunityResponse): number {
  const byPriority = (b.priority ?? 0) - (a.priority ?? 0);
  if (byPriority !== 0) {
    return byPriority;
  }
  return opportunityValue(b) - opportunityValue(a);
}

export function groupOpportunities(
  opportunities: ReadonlyArray<OpportunityResponse>,
): ReadonlyArray<OpportunityGroup> {
  return OPPORTUNITY_TYPES.map((type) => {
    const items = opportunities
      .filter((opportunity) => opportunity.type === type)
      .sort(compareOpportunities);
    return {
      type,
      label: OPPORTUNITY_TYPE_META[type].label,
      hint: OPPORTUNITY_TYPE_META[type].hint,
      items,
      groupValue: items.reduce((sum, item) => sum + opportunityValue(item), 0),
    };
  }).filter((group) => group.items.length > 0);
}

export function totalValue(opportunities: ReadonlyArray<OpportunityResponse>): number {
  return opportunities.reduce((sum, item) => sum + opportunityValue(item), 0);
}

export interface MetricsDateRange {
  readonly from: string;
  readonly to: string;
}

export interface RecoveryCategoryRow {
  readonly label: string;
  readonly detail: string;
  readonly amount: string;
  readonly width: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function formatIsoDay(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Default dashboard window: the last 30 days including today.
export function defaultMetricsRange(now: Date = new Date()): MetricsDateRange {
  const to = formatIsoDay(now);
  const from = formatIsoDay(new Date(now.getTime() - 29 * DAY_MS));
  return { from, to };
}

// Day bounds as backend instants in Bogota time (no daylight saving).
export function rangeBounds(range: MetricsDateRange): { from: string; to: string } {
  return {
    from: `${range.from}T00:00:00-05:00`,
    to: `${range.to}T23:59:59-05:00`,
  };
}

export function recoveredTotals(items: ReadonlyArray<RecoveredValueResponse>): {
  total: number;
  count: number;
} {
  return items.reduce<{ total: number; count: number }>(
    (acc, item) => ({
      total: acc.total + Number(item.totalAmountCop ?? 0),
      count: acc.count + Number(item.count ?? 0),
    }),
    { total: 0, count: 0 },
  );
}

// One row per category with a bar proportional to the largest amount,
// so the biggest recovery reads as the most prominent.
export function recoveryCategoryRows(
  items: ReadonlyArray<RecoveredValueResponse>,
): ReadonlyArray<RecoveryCategoryRow> {
  const parsed = (items ?? []).map((item) => {
    const type = item.type;
    return {
      label: (type && OPPORTUNITY_TYPE_META[type]?.label) || type || 'Sin categoría',
      count: Number(item.count ?? 0),
      amount: Number(item.totalAmountCop ?? 0),
    };
  });
  const max = Math.max(0, ...parsed.map((row) => row.amount));
  return parsed
    .sort((a, b) => b.amount - a.amount)
    .map((row) => ({
      label: row.label,
      detail: `${row.count} recuperada${row.count === 1 ? '' : 's'}`,
      amount: valueLabel(row.amount),
      width: `${max > 0 ? Math.round((row.amount / max) * 100) : 0}%`,
    }));
}
