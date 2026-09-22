import { components } from '@core/api/schema';
import type { ButtonVariant } from '@shared/button/button';

export type AppointmentStatus = NonNullable<components['schemas']['AppointmentResponse']['status']>;

// Targets can never be 'programada' — the backend has no backward transitions.
export type TransitionTarget = Exclude<AppointmentStatus, 'programada'>;

// Spanish labels and badge classes for appointment states.
export const APPOINTMENT_STATUS_META: Record<AppointmentStatus, { label: string; badge: string }> =
  {
    programada: { label: 'Programada', badge: 'bg-info-soft text-info-deep' },
    confirmada: { label: 'Confirmada', badge: 'bg-teal-soft text-teal-deep' },
    atendida: { label: 'Atendida', badge: 'bg-success-soft text-success-deep' },
    no_show: { label: 'No asistió', badge: 'bg-warning-soft text-warning-deep' },
    cancelada: { label: 'Cancelada', badge: 'bg-surface-alt text-mid-gray' },
  };

// Mirrors the backend's allowed-transition map: forward-only, and
// atendida / no_show / cancelada are terminal states with no exits.
export const APPOINTMENT_TRANSITIONS: Record<AppointmentStatus, readonly TransitionTarget[]> = {
  programada: ['confirmada', 'cancelada'],
  confirmada: ['atendida', 'no_show', 'cancelada'],
  atendida: [],
  no_show: [],
  cancelada: [],
};

export function allowedTransitions(
  status: AppointmentStatus | undefined,
): readonly TransitionTarget[] {
  return APPOINTMENT_TRANSITIONS[status ?? 'programada'];
}

// Label and button variant for each transition target shown in the UI.
export const APPOINTMENT_STATUS_ACTIONS: Record<
  TransitionTarget,
  { label: string; variant: ButtonVariant }
> = {
  confirmada: { label: 'Confirmar', variant: 'primary' },
  atendida: { label: 'Marcar atendida', variant: 'secondary' },
  no_show: { label: 'No asistió', variant: 'secondary' },
  cancelada: { label: 'Cancelar', variant: 'danger' },
};
