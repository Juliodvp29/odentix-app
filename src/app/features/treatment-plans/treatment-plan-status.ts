import type { ButtonVariant } from '@shared/button/button';
import type { TreatmentPlanStatus } from './treatment-plan-models';

export type PlanTransitionTarget = Exclude<TreatmentPlanStatus, 'borrador'>;

// Mirrors the backend's allowed-transition map in TreatmentPlanService.
// Terminal states (completado, rechazado, abandonado) have no exits.
export const TREATMENT_PLAN_TRANSITIONS: Record<TreatmentPlanStatus, readonly PlanTransitionTarget[]> = {
  borrador: ['presentado', 'abandonado'],
  presentado: ['en_decision', 'aceptado', 'rechazado', 'pospuesto', 'abandonado'],
  en_decision: ['aceptado', 'rechazado', 'pospuesto', 'abandonado'],
  pospuesto: ['presentado', 'en_decision', 'aceptado', 'rechazado', 'abandonado'],
  aceptado: ['en_ejecucion', 'abandonado'],
  en_ejecucion: ['completado', 'abandonado'],
  completado: [],
  rechazado: [],
  abandonado: [],
};

export function allowedPlanTransitions(
  status: TreatmentPlanStatus | undefined,
): readonly PlanTransitionTarget[] {
  return TREATMENT_PLAN_TRANSITIONS[status ?? 'borrador'];
}

// Terminal negative states require an explicit confirmation step.
export function requiresPlanTransitionConfirm(target: PlanTransitionTarget): boolean {
  return target === 'rechazado' || target === 'abandonado';
}

// Label and button variant for each transition target shown in the UI.
export const TREATMENT_PLAN_STATUS_ACTIONS: Record<
  PlanTransitionTarget,
  { label: string; variant: ButtonVariant }
> = {
  presentado: { label: 'Presentar plan', variant: 'primary' },
  en_decision: { label: 'Poner en decisión', variant: 'secondary' },
  aceptado: { label: 'Aceptar plan', variant: 'primary' },
  en_ejecucion: { label: 'Iniciar ejecución', variant: 'secondary' },
  completado: { label: 'Marcar completado', variant: 'primary' },
  rechazado: { label: 'Rechazar', variant: 'danger' },
  pospuesto: { label: 'Posponer', variant: 'secondary' },
  abandonado: { label: 'Abandonar', variant: 'danger' },
};

export const PLAN_TRANSITION_SUCCESS_MESSAGES: Record<PlanTransitionTarget, string> = {
  presentado: 'Plan presentado.',
  en_decision: 'Plan en decisión.',
  aceptado: 'Plan aceptado.',
  en_ejecucion: 'Plan en ejecución.',
  completado: 'Plan completado.',
  rechazado: 'Plan rechazado.',
  pospuesto: 'Plan pospuesto.',
  abandonado: 'Plan abandonado.',
};
