import { describe, expect, it } from 'vitest';
import {
  PLAN_TRANSITION_SUCCESS_MESSAGES,
  TREATMENT_PLAN_STATUS_ACTIONS,
  TREATMENT_PLAN_TRANSITIONS,
  allowedPlanTransitions,
  requiresPlanTransitionConfirm,
} from './treatment-plan-status';
import type { TreatmentPlanStatus } from './treatment-plan-models';

const ALL_STATUSES: readonly TreatmentPlanStatus[] = [
  'borrador',
  'presentado',
  'en_decision',
  'aceptado',
  'en_ejecucion',
  'completado',
  'rechazado',
  'pospuesto',
  'abandonado',
];

describe('treatment plan status transitions', () => {
  it('should mirror the backend transition map', () => {
    expect([...allowedPlanTransitions('borrador')]).toEqual(['presentado', 'abandonado']);
    expect([...allowedPlanTransitions('presentado')]).toEqual([
      'en_decision',
      'aceptado',
      'rechazado',
      'pospuesto',
      'abandonado',
    ]);
    expect([...allowedPlanTransitions('en_decision')]).toEqual([
      'aceptado',
      'rechazado',
      'pospuesto',
      'abandonado',
    ]);
    expect([...allowedPlanTransitions('pospuesto')]).toEqual([
      'presentado',
      'en_decision',
      'aceptado',
      'rechazado',
      'abandonado',
    ]);
    expect([...allowedPlanTransitions('aceptado')]).toEqual(['en_ejecucion', 'abandonado']);
    expect([...allowedPlanTransitions('en_ejecucion')]).toEqual(['completado', 'abandonado']);
  });

  it('should treat completado, rechazado and abandonado as terminal', () => {
    expect(allowedPlanTransitions('completado')).toEqual([]);
    expect(allowedPlanTransitions('rechazado')).toEqual([]);
    expect(allowedPlanTransitions('abandonado')).toEqual([]);
  });

  it('should default a missing status to borrador', () => {
    expect([...allowedPlanTransitions(undefined)]).toEqual(['presentado', 'abandonado']);
  });

  it('should never list borrador as a transition target', () => {
    for (const status of ALL_STATUSES) {
      expect(TREATMENT_PLAN_TRANSITIONS[status]).not.toContain('borrador');
    }
  });

  it('should define transitions for every status', () => {
    for (const status of ALL_STATUSES) {
      expect(TREATMENT_PLAN_TRANSITIONS[status]).toBeDefined();
    }
  });

  it('should require confirmation only for rechazado and abandonado', () => {
    expect(requiresPlanTransitionConfirm('rechazado')).toBe(true);
    expect(requiresPlanTransitionConfirm('abandonado')).toBe(true);
    for (const target of [
      'presentado',
      'en_decision',
      'aceptado',
      'en_ejecucion',
      'completado',
      'pospuesto',
    ] as const) {
      expect(requiresPlanTransitionConfirm(target)).toBe(false);
    }
  });
});

describe('treatment plan status actions', () => {
  it('should have label and variant meta for every transition target', () => {
    expect(Object.keys(TREATMENT_PLAN_STATUS_ACTIONS).sort()).toEqual(
      [
        'abandonado',
        'aceptado',
        'completado',
        'en_decision',
        'en_ejecucion',
        'pospuesto',
        'presentado',
        'rechazado',
      ].sort(),
    );
    for (const meta of Object.values(TREATMENT_PLAN_STATUS_ACTIONS)) {
      expect(meta.label).toBeTruthy();
      expect(meta.variant).toBeTruthy();
    }
  });

  it('should use the danger variant for terminal negative states', () => {
    expect(TREATMENT_PLAN_STATUS_ACTIONS['rechazado'].variant).toBe('danger');
    expect(TREATMENT_PLAN_STATUS_ACTIONS['abandonado'].variant).toBe('danger');
  });

  it('should have a success message for every transition target', () => {
    for (const target of Object.keys(TREATMENT_PLAN_STATUS_ACTIONS)) {
      expect(
        PLAN_TRANSITION_SUCCESS_MESSAGES[target as keyof typeof PLAN_TRANSITION_SUCCESS_MESSAGES],
      ).toBeTruthy();
    }
  });
});
