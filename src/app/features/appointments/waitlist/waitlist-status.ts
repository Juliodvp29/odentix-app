import { StatusTone } from '@shared/table/table-models';
import { WaitlistEntryResponse, WaitlistStatus } from './waitlist.service';

export interface WaitlistStatusMeta {
  readonly label: string;
  readonly tone: StatusTone;
}

export const WAITLIST_STATUS_META: Record<WaitlistStatus, WaitlistStatusMeta> = {
  activa: { label: 'Activa', tone: 'info' },
  contactado: { label: 'Contactado', tone: 'success' },
  convertida: { label: 'Convertida', tone: 'success' },
  descartada: { label: 'Descartada', tone: 'danger' },
};

export const WAITLIST_STATUS_OPTIONS: ReadonlyArray<{ value: WaitlistStatus; label: string }> = [
  { value: 'activa', label: 'Activa' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'convertida', label: 'Convertida' },
  { value: 'descartada', label: 'Descartada' },
];

export function waitlistStatus(entry: WaitlistEntryResponse): WaitlistStatus {
  return entry.status ?? 'activa';
}

export function waitlistStatusMeta(entry: WaitlistEntryResponse): WaitlistStatusMeta {
  return WAITLIST_STATUS_META[waitlistStatus(entry)];
}

export function canContactWaitlistEntry(entry: WaitlistEntryResponse): boolean {
  return waitlistStatus(entry) === 'activa';
}

export function canDiscardWaitlistEntry(entry: WaitlistEntryResponse): boolean {
  const status = waitlistStatus(entry);
  return status === 'activa' || status === 'contactado';
}

export function canConvertWaitlistEntry(entry: WaitlistEntryResponse): boolean {
  const status = waitlistStatus(entry);
  return status === 'activa' || status === 'contactado';
}
