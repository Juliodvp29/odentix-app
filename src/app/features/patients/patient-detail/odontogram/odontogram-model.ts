import { components } from '@core/api/schema';

export type OdontogramEntry = components['schemas']['OdontogramEntryResponse'];
export type OdontogramEntryType =
  'estado_actual' | 'diagnostico' | 'plan_propuesto' | 'tratamiento_realizado';

export type SurfaceId = 'vestibular' | 'distal' | 'lingual' | 'mesial' | 'oclusal';

export const SURFACES: ReadonlyArray<SurfaceId> = [
  'vestibular',
  'distal',
  'lingual',
  'mesial',
  'oclusal',
];

const SURFACE_LABELS: Record<SurfaceId, string> = {
  vestibular: 'Vestibular',
  distal: 'Distal',
  lingual: 'Lingual',
  mesial: 'Mesial',
  oclusal: 'Oclusal',
};

// Highest entry type wins when a tooth holds several entries.
const ENTRY_TYPE_PRIORITY: Record<OdontogramEntryType, number> = {
  diagnostico: 4,
  plan_propuesto: 3,
  tratamiento_realizado: 2,
  estado_actual: 1,
};

// Clinical chart convention. Values reference design tokens, never raw colors.
export const CHART_COLORS: Record<OdontogramEntryType, string> = {
  diagnostico: 'var(--color-danger)',
  plan_propuesto: 'var(--color-info)',
  tratamiento_realizado: 'var(--color-success)',
  estado_actual: 'var(--color-mid-gray)',
};

export const CHART_NEUTRAL_FILL = 'var(--color-surface-alt)';
export const CHART_NEUTRAL_STROKE = 'var(--color-hairline)';
export const CHART_SELECTION_STROKE = 'var(--color-teal)';

export interface ToothState {
  readonly entries: ReadonlyArray<OdontogramEntry>;
  readonly highestPriorityType: OdontogramEntryType | null;
  readonly isMissing: boolean;
  readonly surfaceTypes: Partial<Record<SurfaceId, OdontogramEntryType>>;
}

export function isKnownType(value: string | undefined): value is OdontogramEntryType {
  return (
    value === 'estado_actual' ||
    value === 'diagnostico' ||
    value === 'plan_propuesto' ||
    value === 'tratamiento_realizado'
  );
}

function isKnownSurface(value: string | undefined): value is SurfaceId {
  return (
    value === 'vestibular' ||
    value === 'distal' ||
    value === 'lingual' ||
    value === 'mesial' ||
    value === 'oclusal'
  );
}

export function toothState(entries: ReadonlyArray<OdontogramEntry>): ToothState {
  let highestPriorityType: OdontogramEntryType | null = null;
  let highestPriority = 0;
  let isMissing = false;
  const surfaceTypes: Partial<Record<SurfaceId, OdontogramEntryType>> = {};
  const surfacePriority: Partial<Record<SurfaceId, number>> = {};

  for (const entry of entries) {
    if (!isKnownType(entry.entryType)) {
      continue;
    }
    const priority = ENTRY_TYPE_PRIORITY[entry.entryType];
    if (priority > highestPriority) {
      highestPriority = priority;
      highestPriorityType = entry.entryType;
    }
    if (entry.condition?.toLowerCase().includes('ausente') === true) {
      isMissing = true;
    }
    if (isKnownSurface(entry.surface) && (surfacePriority[entry.surface] ?? 0) < priority) {
      surfacePriority[entry.surface] = priority;
      surfaceTypes[entry.surface] = entry.entryType;
    }
  }

  return { entries, highestPriorityType, isMissing, surfaceTypes };
}

export function surfaceColor(state: ToothState, surface: SurfaceId): string {
  const type = state.surfaceTypes[surface];
  return type ? CHART_COLORS[type] : CHART_NEUTRAL_FILL;
}

export function surfaceLabel(surface: string | undefined): string {
  if (isKnownSurface(surface)) {
    return SURFACE_LABELS[surface];
  }
  if (!surface) {
    return 'General';
  }
  return surface.charAt(0).toUpperCase() + surface.slice(1);
}

export const QUADRANT_1 = [18, 17, 16, 15, 14, 13, 12, 11];
export const QUADRANT_2 = [21, 22, 23, 24, 25, 26, 27, 28];
export const QUADRANT_3 = [31, 32, 33, 34, 35, 36, 37, 38];
export const QUADRANT_4 = [48, 47, 46, 45, 44, 43, 42, 41];

export const TOOTH_NAMES: Record<number, string> = {
  18: 'Tercer Molar Superior Der.',
  17: 'Segundo Molar Superior Der.',
  16: 'Primer Molar Superior Der.',
  15: 'Segundo Premolar Sup. Der.',
  14: 'Primer Premolar Sup. Der.',
  13: 'Canino Superior Der.',
  12: 'Incisivo Lateral Sup. Der.',
  11: 'Incisivo Central Sup. Der.',
  21: 'Incisivo Central Sup. Izq.',
  22: 'Incisivo Lateral Sup. Izq.',
  23: 'Canino Superior Izq.',
  24: 'Primer Premolar Sup. Izq.',
  25: 'Segundo Premolar Sup. Izq.',
  26: 'Primer Molar Superior Izq.',
  27: 'Segundo Molar Superior Izq.',
  28: 'Tercer Molar Superior Izq.',
  31: 'Incisivo Central Inf. Izq.',
  32: 'Incisivo Lateral Inf. Izq.',
  33: 'Canino Inferior Izq.',
  34: 'Primer Premolar Inf. Izq.',
  35: 'Segundo Premolar Inf. Izq.',
  36: 'Primer Molar Inferior Izq.',
  37: 'Segundo Molar Inferior Izq.',
  38: 'Tercer Molar Inferior Izq.',
  41: 'Incisivo Central Inf. Der.',
  42: 'Incisivo Lateral Inf. Der.',
  43: 'Canino Inferior Der.',
  44: 'Primer Premolar Inf. Der.',
  45: 'Segundo Premolar Inf. Der.',
  46: 'Primer Molar Inferior Der.',
  47: 'Segundo Molar Inferior Der.',
  48: 'Tercer Molar Inferior Der.',
};

export const ENTRY_TYPE_LABELS: Record<OdontogramEntryType, string> = {
  estado_actual: 'Estado actual',
  diagnostico: 'Diagnóstico',
  plan_propuesto: 'Plan propuesto',
  tratamiento_realizado: 'Tratamiento realizado',
};

// Soft badges pair the clinical chart with the app's semantic pattern.
export const ENTRY_TYPE_BADGES: Record<OdontogramEntryType, string> = {
  estado_actual: 'bg-teal-soft text-teal-deep',
  diagnostico: 'bg-danger-soft text-danger-deep',
  plan_propuesto: 'bg-info-soft text-info-deep',
  tratamiento_realizado: 'bg-success-soft text-success-deep',
};

export interface ToothStatusMeta {
  readonly label: string;
  readonly badge: string;
}

// Short status pill for a tooth, pairing the clinical chart with soft badges.
export function toothStatus(state: ToothState): ToothStatusMeta {
  if (state.isMissing) {
    return { label: 'Pieza ausente', badge: 'bg-surface-alt text-mid-gray' };
  }
  switch (state.highestPriorityType) {
    case 'diagnostico':
      return { label: 'Requiere atención', badge: 'bg-danger-soft text-danger-deep' };
    case 'plan_propuesto':
      return { label: 'Plan pendiente', badge: 'bg-info-soft text-info-deep' };
    case 'tratamiento_realizado':
      return { label: 'Sana / Tratada', badge: 'bg-success-soft text-success-deep' };
    case 'estado_actual':
      return { label: 'Registrada', badge: 'bg-teal-soft text-teal-deep' };
    default:
      return { label: 'Sin hallazgos', badge: 'bg-surface-alt text-mid-gray' };
  }
}
