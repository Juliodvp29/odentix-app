import { Component, computed, inject } from '@angular/core';
import { formatCop } from '@features/treatment-plans/treatment-plan-models';
import { Button } from '@shared/button/button';
import { Icon } from '@shared/icon/icon';
import { Skeleton } from '@shared/skeleton/skeleton';
import { portfolioStats } from '../portfolio-models';
import { PortfolioService, isPlanGateError } from '../portfolio.service';

@Component({
  selector: 'app-portfolio-dashboard',
  imports: [Button, Icon, Skeleton],
  templateUrl: './portfolio-dashboard.html',
  host: { class: 'block space-y-24' },
})
export class PortfolioDashboard {
  private readonly portfolio = inject(PortfolioService);
  private readonly summaryResource = this.portfolio.summary();

  readonly loading = computed(() => this.summaryResource.isLoading());
  readonly planGated = computed(() => isPlanGateError(this.summaryResource.error()));
  readonly loadFailed = computed(
    () => !this.planGated() && this.summaryResource.error() !== undefined,
  );
  readonly empty = computed(
    () => !this.loading() && !this.loadFailed() && (this.summaryResource.value()?.totalInstallmentsCount ?? 0) === 0,
  );

  readonly stats = computed(() => portfolioStats(this.summaryResource.value() ?? null));

  formatPrice(val: number | null | undefined): string {
    return formatCop(val);
  }

  retry(): void {
    this.summaryResource.reload();
  }
}
