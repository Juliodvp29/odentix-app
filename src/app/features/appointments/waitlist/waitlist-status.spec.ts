import { WaitlistEntryResponse } from './waitlist.service';
import {
  canContactWaitlistEntry,
  canConvertWaitlistEntry,
  canDiscardWaitlistEntry,
  waitlistStatus,
  waitlistStatusMeta,
} from './waitlist-status';

function entry(status: WaitlistEntryResponse['status']): WaitlistEntryResponse {
  return { id: 'entry-1', status };
}

describe('waitlist status helpers', () => {
  it('should default missing status to active and expose its label', () => {
    expect(waitlistStatus({ id: 'entry-1' })).toBe('activa');
    expect(waitlistStatusMeta(entry('contactado')).label).toBe('Contactado');
  });

  it('should expose only valid lifecycle actions', () => {
    expect(canContactWaitlistEntry(entry('activa'))).toBe(true);
    expect(canContactWaitlistEntry(entry('contactado'))).toBe(false);
    expect(canDiscardWaitlistEntry(entry('activa'))).toBe(true);
    expect(canDiscardWaitlistEntry(entry('contactado'))).toBe(true);
    expect(canDiscardWaitlistEntry(entry('convertida'))).toBe(false);
    expect(canConvertWaitlistEntry(entry('activa'))).toBe(true);
    expect(canConvertWaitlistEntry(entry('contactado'))).toBe(true);
    expect(canConvertWaitlistEntry(entry('descartada'))).toBe(false);
  });
});
