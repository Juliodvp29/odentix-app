import { components } from '@core/api/schema';

export type PlanSummaryResponse = components['schemas']['PlanSummaryResponse'];

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
