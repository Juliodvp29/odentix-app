import { describe, expect, it } from 'vitest';
import { planHasFeature, planLimit } from './plan-models';
import { PlanSummaryResponse } from './plan-models';

const ESENCIAL: PlanSummaryResponse = {
  planCode: 'esencial',
  features: [],
  limits: { max_patients: 150 },
};

describe('planHasFeature', () => {
  it('should hide features missing from a loaded plan', () => {
    expect(planHasFeature(ESENCIAL, false, 'opportunities_engine')).toBe(false);
    expect(planHasFeature(ESENCIAL, false, 'crm_leads')).toBe(false);
  });

  it('should show features included in a loaded plan', () => {
    const clinica: PlanSummaryResponse = {
      planCode: 'clinica',
      features: ['opportunities_engine', 'ai_assistant'],
      limits: {},
    };
    expect(planHasFeature(clinica, false, 'opportunities_engine')).toBe(true);
  });

  it('should hide gated entries while the plan is still loading', () => {
    expect(planHasFeature(null, false, 'opportunities_engine')).toBe(false);
    expect(planHasFeature(undefined, false, 'opportunities_engine')).toBe(false);
  });

  it('should fail open without a plan code or on request errors', () => {
    expect(planHasFeature({ planCode: undefined, features: [], limits: {} }, false, 'x')).toBe(
      true,
    );
    expect(planHasFeature(ESENCIAL, true, 'opportunities_engine')).toBe(true);
    expect(planHasFeature(null, true, 'opportunities_engine')).toBe(true);
  });
});

describe('planLimit', () => {
  it('should read numeric limits and fall back to null', () => {
    expect(planLimit(ESENCIAL, 'max_patients')).toBe(150);
    expect(planLimit(ESENCIAL, 'unknown_key')).toBeNull();
    expect(planLimit(null, 'max_patients')).toBeNull();
  });
});
