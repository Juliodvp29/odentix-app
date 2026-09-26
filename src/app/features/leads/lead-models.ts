import { components } from '@core/api/schema';

export type LeadResponse = components['schemas']['LeadResponse'];
export type PageLeadResponse = components['schemas']['PageLeadResponse'];
export type UpdateLeadStatusRequest = components['schemas']['UpdateLeadStatusRequest'];
export type CreateLeadActivityRequest = components['schemas']['CreateLeadActivityRequest'];
export type LeadActivityResponse = components['schemas']['LeadActivityResponse'];
export type ConvertLeadRequest = components['schemas']['ConvertLeadRequest'];
export type ConvertLeadPatientData = components['schemas']['ConvertLeadPatientData'];
export type ConvertLeadResponse = components['schemas']['ConvertLeadResponse'];

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
