import { describe, expect, it } from 'vitest';
import {
  STATUS_META,
  TOOTH_OPTIONS,
  calculateItemNetPrice,
  calculatePlanTotals,
  formatCop,
} from './treatment-plan-models';

describe('treatment-plan-models', () => {
  describe('formatCop', () => {
    it('should format amounts in Colombian Pesos', () => {
      const formatted = formatCop(150000);
      expect(formatted).toContain('150.000');
      expect(formatted).toContain('$');
    });

    it('should handle zero and null gracefully', () => {
      expect(formatCop(0)).toContain('0');
      expect(formatCop(null)).toContain('0');
      expect(formatCop(undefined)).toContain('0');
    });
  });

  describe('calculateItemNetPrice', () => {
    it('should compute price minus discount', () => {
      expect(calculateItemNetPrice(200000, 50000)).toBe(150000);
    });

    it('should not allow negative net price even if discount exceeds price', () => {
      expect(calculateItemNetPrice(100000, 150000)).toBe(0);
    });

    it('should handle missing discount', () => {
      expect(calculateItemNetPrice(100000, 0)).toBe(100000);
    });
  });

  describe('calculatePlanTotals', () => {
    it('should accumulate gross, discount, and net totals', () => {
      const items = [
        { priceCop: 100000, discountCop: 10000 },
        { priceCop: 250000, discountCop: 0 },
        { priceCop: 50000, discountCop: 5000 },
      ];

      const totals = calculatePlanTotals(items);
      expect(totals.gross).toBe(400000);
      expect(totals.discount).toBe(15000);
      expect(totals.net).toBe(385000);
    });

    it('should cap discount per item at its gross price in totals', () => {
      const items = [{ priceCop: 100000, discountCop: 150000 }];
      const totals = calculatePlanTotals(items);
      expect(totals.gross).toBe(100000);
      expect(totals.discount).toBe(100000);
      expect(totals.net).toBe(0);
    });

    it('should handle empty items array', () => {
      const totals = calculatePlanTotals([]);
      expect(totals.gross).toBe(0);
      expect(totals.discount).toBe(0);
      expect(totals.net).toBe(0);
    });
  });

  describe('STATUS_META', () => {
    it('should map all backend statuses to labels and styles', () => {
      expect(STATUS_META.borrador.label).toBe('Borrador');
      expect(STATUS_META.presentado.label).toBe('Presentado');
      expect(STATUS_META.aceptado.label).toBe('Aceptado');
      expect(STATUS_META.en_ejecucion.label).toBe('En ejecución');
      expect(STATUS_META.completado.label).toBe('Completado');
      expect(STATUS_META.rechazado.label).toBe('Rechazado');
    });
  });

  describe('TOOTH_OPTIONS', () => {
    it('should include whole mouth as first option and 32 FDI teeth', () => {
      expect(TOOTH_OPTIONS[0].value).toBeNull();
      expect(TOOTH_OPTIONS[0].label).toContain('General');
      expect(TOOTH_OPTIONS.length).toBe(33);
    });
  });
});
