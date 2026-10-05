import { components } from '@core/api/schema';

export type PlanSummaryResponse = components['schemas']['PlanSummaryResponse'];
export type PlanCatalogResponse = components['schemas']['PlanCatalogResponse'];
export type CheckoutRequest = components['schemas']['CheckoutRequest'];
export type CheckoutResponse = components['schemas']['CheckoutResponse'];
export type BillingCycle = NonNullable<CheckoutRequest['billingCycle']>;

// Feature keys mirror the backend `plan_features` catalog. New backend
// features only need a new constant here plus a `feature` on the nav item.
export const PLAN_FEATURE_CRM_LEADS = 'crm_leads';
export const PLAN_FEATURE_CARTERA = 'cartera';
export const PLAN_FEATURE_SPECIALISTS = 'specialists';
export const PLAN_FEATURE_INVENTORY = 'inventory';
export const PLAN_FEATURE_OPPORTUNITIES = 'opportunities_engine';
export const PLAN_FEATURE_AI_ASSISTANT = 'ai_assistant';

// Fail-open rules (same as the backend): request errors keep the
// navigation usable, and a missing plan code means pre-billing, so
// nothing is hidden. Only a loaded plan with a missing feature hides.
export function planHasFeature(
  plan: PlanSummaryResponse | null | undefined,
  requestFailed: boolean,
  feature: string,
): boolean {
  if (requestFailed) {
    return true;
  }
  if (!plan) {
    return false;
  }
  if (plan.planCode == null) {
    return true;
  }
  return plan.features?.includes(feature) ?? false;
}

export function planLimit(
  plan: PlanSummaryResponse | null | undefined,
  limitKey: string,
): number | null {
  const value = plan?.limits?.[limitKey];
  return typeof value === 'number' ? value : null;
}

// Display copy for backend catalog keys. Unknown keys show raw so the
// UI never hides backend data; labels stay Spanish-only here.
const FEATURE_LABELS: Record<string, string> = {
  crm_leads: 'Prospectos y CRM',
  cartera: 'Cartera y cobros',
  automations_full: 'Automatizaciones completas',
  specialists: 'Especialistas y liquidaciones',
  inventory: 'Inventario',
  inventory_alerts: 'Alertas de inventario',
  opportunities_engine: 'Motor de oportunidades',
  ai_assistant: 'Asistente con IA',
};

const LIMIT_LABELS: Record<string, string> = {
  max_sedes: 'Sedes',
  max_users: 'Usuarios',
  max_patients: 'Pacientes',
  whatsapp_conversations_month: 'Conversaciones de WhatsApp / mes',
  max_specialists: 'Especialistas externos',
  opportunities_max_rules: 'Reglas de oportunidades',
};

export function featureLabel(key: string): string {
  return FEATURE_LABELS[key] ?? key;
}

export function limitLabel(key: string): string {
  return LIMIT_LABELS[key] ?? key;
}

// A zero limit reads as not included; anything else shows the number.
export function limitValueLabel(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'Ilimitado';
  }
  return value === 0 ? 'No incluido' : String(value);
}

export function isCurrentPlan(
  planCode: string | null | undefined,
  current: string | null | undefined,
): boolean {
  return !!planCode && planCode === current;
}
