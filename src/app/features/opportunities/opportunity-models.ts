import { formatCurrencyCop } from '@shared/table/table-models';
import { components } from '@core/api/schema';

export type OpportunityResponse = components['schemas']['OpportunityResponse'];
export type OpportunityActionResponse = components['schemas']['OpportunityActionResponse'];
export type UpdateOpportunityStatusRequest =
  components['schemas']['UpdateOpportunityStatusRequest'];

export type OpportunityType = NonNullable<OpportunityResponse['type']>;
export type OpportunityStatus = NonNullable<OpportunityResponse['status']>;

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
