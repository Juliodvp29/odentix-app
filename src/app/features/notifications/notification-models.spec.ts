import { describe, expect, it } from 'vitest';
import {
  instantLabel,
  notificationChannelLabel,
  notificationStatusLabel,
} from './notification-models';

describe('notificationStatusLabel', () => {
  it('should label every known status in Spanish', () => {
    expect(notificationStatusLabel('pendiente')).toBe('Pendiente');
    expect(notificationStatusLabel('enviada')).toBe('Enviada');
    expect(notificationStatusLabel('fallida')).toBe('Fallida');
  });

  it('should fall back for missing statuses', () => {
    expect(notificationStatusLabel(null)).toBe('Sin estado');
    expect(notificationStatusLabel(undefined)).toBe('Sin estado');
  });
});

describe('notificationChannelLabel', () => {
  it('should label every known channel', () => {
    expect(notificationChannelLabel('email')).toBe('Email');
    expect(notificationChannelLabel('whatsapp')).toBe('WhatsApp');
    expect(notificationChannelLabel('sms')).toBe('SMS');
  });

  it('should fall back for missing channels', () => {
    expect(notificationChannelLabel(null)).toBe('—');
    expect(notificationChannelLabel(undefined)).toBe('—');
  });
});

describe('instantLabel', () => {
  it('should render an instant as date and time', () => {
    expect(instantLabel('2026-09-28T09:46:31Z')).toBe('2026-09-28 09:46');
  });

  it('should fall back when there is no instant', () => {
    expect(instantLabel(null)).toBe('—');
    expect(instantLabel(undefined)).toBe('—');
  });
});
