import { describe, expect, it } from 'vitest';
import {
  INSTALLMENT_STATUS_META,
  canPayInstallment,
  isPaidInstallment,
  previewInstallments,
  sumInstallments,
} from './payment-plan-models';

describe('installment status meta', () => {
  it('should follow the approved invoice-like mapping', () => {
    expect(INSTALLMENT_STATUS_META.pendiente.textClass).toContain('warning');
    expect(INSTALLMENT_STATUS_META.pagada.textClass).toContain('success');
    expect(INSTALLMENT_STATUS_META.vencida.textClass).toContain('danger');
    expect(INSTALLMENT_STATUS_META.pendiente.label).toBe('Pendiente');
    expect(INSTALLMENT_STATUS_META.pagada.label).toBe('Pagada');
    expect(INSTALLMENT_STATUS_META.vencida.label).toBe('Vencida');
  });
});

describe('previewInstallments', () => {
  it('should split evenly when the total divides exactly', () => {
    expect(previewInstallments(300000, 3)).toEqual([100000, 100000, 100000]);
  });

  it('should absorb the rounding remainder in the last installment', () => {
    const amounts = previewInstallments(1000, 3);
    expect(amounts).toEqual([333, 333, 334]);
    expect(amounts.reduce((sum, amount) => sum + amount, 0)).toBe(1000);
  });

  it('should always close to the total', () => {
    for (const [total, count] of [
      [520000, 3],
      [999999, 7],
      [50000, 1],
      [100000, 60],
    ] as const) {
      const amounts = previewInstallments(total, count);
      expect(amounts).toHaveLength(count);
      expect(amounts.reduce((sum, amount) => sum + amount, 0)).toBe(total);
    }
  });

  it('should return no preview for empty input', () => {
    expect(previewInstallments(0, 3)).toEqual([]);
    expect(previewInstallments(100000, 0)).toEqual([]);
  });
});

describe('installment helpers', () => {
  it('should sum installment amounts', () => {
    expect(sumInstallments([{ amountCop: 100000 }, { amountCop: 50000 }])).toBe(150000);
  });

  it('should only allow paying pending or overdue installments', () => {
    expect(canPayInstallment('pendiente')).toBe(true);
    expect(canPayInstallment('vencida')).toBe(true);
    expect(canPayInstallment('pagada')).toBe(false);
    expect(isPaidInstallment('pagada')).toBe(true);
    expect(isPaidInstallment('pendiente')).toBe(false);
  });
});
