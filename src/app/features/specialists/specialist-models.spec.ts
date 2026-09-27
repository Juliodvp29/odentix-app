import { describe, expect, it } from 'vitest';
import {
  SETTLEMENT_STATUS_META,
  previewFeeAmount,
  specialistInitials,
  sumBreakdownLines,
} from './specialist-models';

describe('settlement status meta', () => {
  it('should label both states in Spanish', () => {
    expect(SETTLEMENT_STATUS_META.pendiente.label).toBe('Pendiente');
    expect(SETTLEMENT_STATUS_META.pagada.label).toBe('Pagada');
    expect(SETTLEMENT_STATUS_META.pendiente.textClass).toContain('warning');
    expect(SETTLEMENT_STATUS_META.pagada.textClass).toContain('success');
  });
});

describe('previewFeeAmount', () => {
  it('should mirror the backend gross × fee % formula', () => {
    expect(previewFeeAmount(1000000, 30)).toBe(300000);
    expect(previewFeeAmount(540000, 25)).toBe(135000);
    expect(previewFeeAmount(0, 30)).toBe(0);
  });
});

describe('sumBreakdownLines', () => {
  it('should sum invoice totals for gross reconciliation', () => {
    expect(sumBreakdownLines([{ totalCop: 400000 }, { totalCop: 140000 }])).toBe(540000);
  });
});

describe('specialistInitials', () => {
  it('should build initials from the professional name', () => {
    expect(specialistInitials('María Gómez')).toBe('MG');
    expect(specialistInitials(null)).toBe('—');
  });
});
