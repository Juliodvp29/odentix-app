import { components } from '@core/api/schema';

export type LeadResponse = components['schemas']['LeadResponse'];
export type PageLeadResponse = components['schemas']['PageLeadResponse'];
export type UpdateLeadStatusRequest = components['schemas']['UpdateLeadStatusRequest'];
export type CreateLeadActivityRequest = components['schemas']['CreateLeadActivityRequest'];
export type LeadActivityResponse = components['schemas']['LeadActivityResponse'];
export type ConvertLeadRequest = components['schemas']['ConvertLeadRequest'];
export type ConvertLeadPatientData = components['schemas']['ConvertLeadPatientData'];
export type ConvertLeadResponse = components['schemas']['ConvertLeadResponse'];
export type LeadConversionMetricsResponse =
  components['schemas']['LeadConversionMetricsResponse'];
export type LeadResponseTimeMetricsResponse =
  components['schemas']['LeadResponseTimeMetricsResponse'];
export type ConversionMetricItem = components['schemas']['ConversionMetricItem'];

export type LeadStatus = NonNullable<LeadResponse['status']>;
export type LeadActivityType = NonNullable<CreateLeadActivityRequest['activityType']>;

export interface LeadActivityTypeMeta {
  readonly label: string;
  readonly bgClass: string;
  readonly textClass: string;
}

export const LEAD_ACTIVITY_TYPES: ReadonlyArray<LeadActivityType> = [
  'llamada',
  'whatsapp',
  'email',
  'nota',
];

export const LEAD_ACTIVITY_TYPE_META: Record<LeadActivityType, LeadActivityTypeMeta> = {
  llamada: {
    label: 'Llamada',
    bgClass: 'bg-info-soft',
    textClass: 'text-info-deep',
  },
  whatsapp: {
    label: 'WhatsApp',
    bgClass: 'bg-success-soft',
    textClass: 'text-success-deep',
  },
  email: {
    label: 'Correo',
    bgClass: 'bg-teal-soft',
    textClass: 'text-teal-deep',
  },
  nota: {
    label: 'Nota',
    bgClass: 'bg-surface-alt',
    textClass: 'text-ink-soft',
  },
};

export interface LeadStageMeta {
  readonly label: string;
  readonly bgClass: string;
  readonly textClass: string;
}

// Funnel order follows the backend pipeline; colors use only existing
// tones (approved mapping): nuevo neutral, early contact Info,
// appointment stages Teal Soft, proposed treatment Warning,
// accepted treatment Success, lost Danger.
export const LEAD_STAGES: ReadonlyArray<LeadStatus> = [
  'nuevo',
  'contactado',
  'calificado',
  'cita_propuesta',
  'cita_agendada',
  'cita_asistida',
  'tratamiento_propuesto',
  'tratamiento_aceptado',
  'perdido',
];

export const LEAD_STAGE_META: Record<LeadStatus, LeadStageMeta> = {
  nuevo: {
    label: 'Nuevo',
    bgClass: 'bg-surface-alt',
    textClass: 'text-ink-soft',
  },
  contactado: {
    label: 'Contactado',
    bgClass: 'bg-info-soft',
    textClass: 'text-info-deep',
  },
  calificado: {
    label: 'Calificado',
    bgClass: 'bg-info-soft',
    textClass: 'text-info-deep',
  },
  cita_propuesta: {
    label: 'Cita propuesta',
    bgClass: 'bg-teal-soft',
    textClass: 'text-teal-deep',
  },
  cita_agendada: {
    label: 'Cita agendada',
    bgClass: 'bg-teal-soft',
    textClass: 'text-teal-deep',
  },
  cita_asistida: {
    label: 'Cita asistida',
    bgClass: 'bg-teal-soft',
    textClass: 'text-teal-deep',
  },
  tratamiento_propuesto: {
    label: 'Tratamiento propuesto',
    bgClass: 'bg-warning-soft',
    textClass: 'text-warning-deep',
  },
  tratamiento_aceptado: {
    label: 'Tratamiento aceptado',
    bgClass: 'bg-success-soft',
    textClass: 'text-success-deep',
  },
  perdido: {
    label: 'Perdido',
    bgClass: 'bg-danger-soft',
    textClass: 'text-danger-deep',
  },
};

export type LeadsByStage = Record<LeadStatus, LeadResponse[]>;

export function emptyLeadsByStage(): LeadsByStage {
  return {
    nuevo: [],
    contactado: [],
    calificado: [],
    cita_propuesta: [],
    cita_agendada: [],
    cita_asistida: [],
    tratamiento_propuesto: [],
    tratamiento_aceptado: [],
    perdido: [],
  };
}

// Groups leads into every funnel stage; leads with an unknown or
// missing status fall back to the first stage instead of disappearing.
export function groupLeadsByStage(leads: ReadonlyArray<LeadResponse>): LeadsByStage {
  const grouped = emptyLeadsByStage();
  for (const lead of leads) {
    const status = lead.status;
    if (status && status in grouped) {
      grouped[status as LeadStatus].push(lead);
    } else {
      grouped.nuevo.push(lead);
    }
  }
  return grouped;
}

// Initials for the assignee avatar (initials-only per the design system).
export function assigneeInitials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '—';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export interface SplitName {
  readonly firstName: string;
  readonly lastName: string;
}

// Mirrors the backend's name inference: first token is the given name,
// everything else is the family name.
export function splitLeadName(fullName: string | null | undefined): SplitName {
  const clean = (fullName ?? '').trim();
  const firstSpace = clean.indexOf(' ');
  if (firstSpace > 0) {
    return {
      firstName: clean.substring(0, firstSpace).trim(),
      lastName: clean.substring(firstSpace + 1).trim(),
    };
  }
  return { firstName: clean, lastName: '' };
}

const percentFormatter = new Intl.NumberFormat('es-CO', {
  style: 'percent',
  maximumFractionDigits: 1,
});

// Backend rates arrive as 0-100 percentages; Intl wants 0-1 fractions.
export function formatPercent(rate: number | null | undefined): string {
  const safe = Number(rate ?? 0);
  return percentFormatter.format(Number.isFinite(safe) ? safe / 100 : 0);
}

// Average response time in minutes rendered as Spanish duration text.
export function formatResponseTime(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) {
    return '—';
  }
  const total = Math.max(0, Math.round(minutes));
  if (total < 60) {
    return `${total} min`;
  }
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

// Bar width for a 0-100 rate, clamped so bad data never breaks layout.
export function rateBarWidth(rate: number | null | undefined): string {
  const safe = Number(rate ?? 0);
  const clamped = Math.min(100, Math.max(0, Number.isFinite(safe) ? safe : 0));
  return `${clamped}%`;
}

export interface MetricsDateRange {
  readonly from: string;
  readonly to: string;
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

// Day bounds as backend instants in Bogota time (no daylight saving),
// matching the agenda's day-limit convention.
export function rangeBounds(range: MetricsDateRange): { from: string; to: string } {
  return {
    from: `${range.from}T00:00:00-05:00`,
    to: `${range.to}T23:59:59-05:00`,
  };
}
