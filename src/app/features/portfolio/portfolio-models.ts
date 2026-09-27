import { components } from '@core/api/schema';

export type PortfolioSummaryResponse = components['schemas']['PortfolioSummaryResponse'];

export interface PortfolioStat {
  readonly label: string;
  readonly amount: number;
  readonly count: number;
  readonly valueClass: string;
}

// Cards follow the approved installment semantics: total neutral,
// overdue Danger, upcoming Warning, paid Success, outstanding Info.
export function portfolioStats(summary: PortfolioSummaryResponse | null): PortfolioStat[] {
  const data = summary ?? {};
  return [
    {
      label: 'Cartera total',
      amount: data.totalAmountCop ?? 0,
      count: data.totalInstallmentsCount ?? 0,
      valueClass: 'text-ink',
    },
    {
      label: 'Vencida',
      amount: data.overdueAmountCop ?? 0,
      count: data.overdueInstallmentsCount ?? 0,
      valueClass: 'text-danger-deep',
    },
    {
      label: 'Por vencer',
      amount: data.upcomingAmountCop ?? 0,
      count: data.upcomingInstallmentsCount ?? 0,
      valueClass: 'text-warning-deep',
    },
    {
      label: 'Pagada',
      amount: data.paidAmountCop ?? 0,
      count: data.paidInstallmentsCount ?? 0,
      valueClass: 'text-success-deep',
    },
    {
      label: 'Saldo pendiente',
      amount: data.outstandingAmountCop ?? 0,
      count: (data.overdueInstallmentsCount ?? 0) + (data.upcomingInstallmentsCount ?? 0),
      valueClass: 'text-info-deep',
    },
  ];
}
