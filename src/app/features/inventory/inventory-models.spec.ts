import { describe, expect, it } from 'vitest';
import { isCriticalItem, stockLabel } from './inventory-models';

describe('isCriticalItem', () => {
  it('should flag items at or below the threshold', () => {
    expect(isCriticalItem({ quantity: 5, minThreshold: 10 })).toBe(true);
    expect(isCriticalItem({ quantity: 10, minThreshold: 10 })).toBe(true);
    expect(isCriticalItem({ quantity: 11, minThreshold: 10 })).toBe(false);
    expect(isCriticalItem({ quantity: 0, minThreshold: 0 })).toBe(true);
  });
});

describe('stockLabel', () => {
  it('should render quantity with its unit when present', () => {
    expect(stockLabel({ quantity: 5, unit: 'cajas' })).toBe('5 cajas');
    expect(stockLabel({ quantity: 5 })).toBe('5');
  });
});
