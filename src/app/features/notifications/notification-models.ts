import { components } from '@core/api/schema';

export type NotificationResponse = components['schemas']['NotificationResponse'];
export type PageNotificationResponse = components['schemas']['PageNotificationResponse'];

export type NotificationStatus = NonNullable<NotificationResponse['status']>;
export type NotificationChannel = NonNullable<NotificationResponse['channel']>;

export type NotificationTone = 'success' | 'warning' | 'danger';

export const NOTIFICATION_STATUSES: ReadonlyArray<NotificationStatus> = [
  'pendiente',
  'enviada',
  'fallida',
];

export const NOTIFICATION_CHANNELS: ReadonlyArray<NotificationChannel> = [
  'email',
  'whatsapp',
  'sms',
];

export const NOTIFICATION_STATUS_META: Record<
  NotificationStatus,
  { label: string; tone: NotificationTone }
> = {
  pendiente: { label: 'Pendiente', tone: 'warning' },
  enviada: { label: 'Enviada', tone: 'success' },
  fallida: { label: 'Fallida', tone: 'danger' },
};

export const NOTIFICATION_CHANNEL_LABELS: Record<NotificationChannel, string> = {
  email: 'Email',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
};

// Bounded window, newest first: the table says so honestly when the
// backend holds more attempts than the fetched page.
export const NOTIFICATION_PAGE_SIZE = 100;

export function notificationStatusLabel(status: NotificationStatus | null | undefined): string {
  if (!status) {
    return 'Sin estado';
  }
  return NOTIFICATION_STATUS_META[status]?.label ?? status;
}

export function notificationChannelLabel(channel: NotificationChannel | null | undefined): string {
  if (!channel) {
    return '—';
  }
  return NOTIFICATION_CHANNEL_LABELS[channel] ?? channel;
}

// Short sortable rendering of an instant: "2026-09-28 09:46".
export function instantLabel(instant: string | null | undefined): string {
  if (!instant) {
    return '—';
  }
  return instant.length >= 16 ? instant.slice(0, 16).replace('T', ' ') : instant;
}
