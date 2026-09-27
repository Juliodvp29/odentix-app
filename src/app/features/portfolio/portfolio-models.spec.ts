import { describe, expect, it } from 'vitest';
import { PortfolioSummaryResponse, portfolioStats } from './portfolio-models';

const SUMMARY: PortfolioSummaryResponse = {
  totalAmountCop: 900000,
  overdueAmountCop: 100000,
  upcomingAmountCop: 500000,
  paidAmountCop: 300000,
  outstandingAmountCop: 600000,
  totalInstallmentsCount: 9,
  overdueInstallmentsCount: 1,
  upcomingInstallmentsCount: 5,
  paidInstallmentsCount: 3,
};

describe('portfolioStats', () => {
  it('should map the backend summary to five labeled cards', () => {
    const stats = portfolioStats(SUMMARY);
    expect(stats.map((stat) => stat.label)).toEqual([
      'Cartera total',
      'Vencida',
      'Por vencer',
      'Pagada',
      'Saldo pendiente',
    ]);
    expect(stats[0]).toMatchObject({ amount: 900000, count: 9, valueClass: 'text-ink' });
    expect(stats[1]).toMatchObject({ amount: 100000, count: 1, valueClass: 'text-danger-deep' });
    expect(stats[2]).toMatchObject({ amount: 500000, count: 5, valueClass: 'text-warning-deep' });
    expect(stats[3]).toMatchObject({ amount: 300000, count: 3, valueClass: 'text-success-deep' });
    expect(stats[4]).toMatchObject({ amount: 600000, count: 6, valueClass: 'text-info-deep' });
  });

  it('should default missing values to zero', () => {
    const stats = portfolioStats(null);
    expect(stats).toHaveLength(5);
    for (const stat of stats) {
      expect(stat.amount).toBe(0);
      expect(stat.count).toBe(0);
    }
  });
});
