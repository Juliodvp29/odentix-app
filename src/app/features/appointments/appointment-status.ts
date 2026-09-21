import { components } from '@core/api/schema';

export type AppointmentStatus = NonNullable<components['schemas']['AppointmentResponse']['status']>;

// Spanish labels and badge classes for appointment states.
export const APPOINTMENT_STATUS_META: Record<AppointmentStatus, { label: string; badge: string }> =
  {
    programada: { label: 'Programada', badge: 'bg-info-soft text-info-deep' },
    confirmada: { label: 'Confirmada', badge: 'bg-teal-soft text-teal-deep' },
    atendida: { label: 'Atendida', badge: 'bg-success-soft text-success-deep' },
    no_show: { label: 'No asistió', badge: 'bg-warning-soft text-warning-deep' },
    cancelada: { label: 'Cancelada', badge: 'bg-surface-alt text-mid-gray' },
  };
