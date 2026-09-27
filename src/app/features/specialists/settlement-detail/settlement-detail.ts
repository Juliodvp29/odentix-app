import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatCop } from '@features/treatment-plans/treatment-plan-models';
import { Button } from '@shared/button/button';
import { Icon } from '@shared/icon/icon';
import { Skeleton } from '@shared/skeleton/skeleton';
import { formatDateEs } from '@shared/table/table-models';
import {
  SETTLEMENT_STATUS_META,
  SettlementBreakdownLineResponse,
  SettlementBreakdownResponse,
  SettlementResponse,
  SettlementStatus,
  sumBreakdownLines,
} from '../specialist-models';
import { SettlementsService, isPlanGateError } from '../settlements.service';

@Component({
  selector: 'app-settlement-detail',
  imports: [Button, Icon, RouterLink, Skeleton],
  templateUrl: './settlement-detail.html',
  host: {
    class: 'block mx-auto max-w-5xl',
  },
})
export class SettlementDetail {
  readonly specialistId = input.required<string>();
  readonly settlementId = input.required<string>();

  private readonly settlements = inject(SettlementsService);

  private readonly settlementResource = this.settlements.settlement(
    this.specialistId,
    this.settlementId,
  );
  private readonly breakdownResource = this.settlements.breakdown(
    this.specialistId,
    this.settlementId,
  );

  readonly settlement = computed<SettlementResponse | null>(
    () => this.settlementResource.value() ?? null,
  );
  readonly breakdown = computed<SettlementBreakdownResponse | null>(
    () => this.breakdownResource.value() ?? null,
  );
  readonly loading = computed(
    () => this.settlementResource.isLoading() || this.breakdownResource.isLoading(),
  );
  readonly planGated = computed(
    () =>
      isPlanGateError(this.settlementResource.error()) ||
      isPlanGateError(this.breakdownResource.error()),
  );
  readonly loadFailed = computed(
    () =>
      !this.planGated() &&
      (this.settlementResource.error() !== undefined ||
        this.breakdownResource.error() !== undefined),
  );

  readonly lines = computed<SettlementBreakdownLineResponse[]>(
    () => this.breakdown()?.invoices ?? [],
  );
  // Recomputed from the visible lines. The breakdown reflects the live
  // invoices, so it can drift from the settled gross when the period's
  // billing changed afterwards — both numbers stay visible.
  readonly linesSubtotal = computed(() => sumBreakdownLines(this.lines()));
  readonly drifted = computed(() => {
    const gross = this.settlement()?.grossProductionCop ?? this.breakdown()?.grossProductionCop;
    return gross !== undefined && gross !== null && Number(gross) !== this.linesSubtotal();
  });

  settlementMeta(status: SettlementStatus | string | null | undefined): {
    label: string;
    pill: string;
  } {
    if (status && status in SETTLEMENT_STATUS_META) {
      const meta = SETTLEMENT_STATUS_META[status as SettlementStatus];
      return { label: meta.label, pill: `${meta.bgClass} ${meta.textClass}` };
    }
    return { label: status ?? '—', pill: 'bg-surface-alt text-ink-soft' };
  }

  formatPrice(val: number | null | undefined): string {
    return formatCop(val);
  }

  formatDate(date: string | null | undefined): string {
    return date ? formatDateEs(date) : '—';
  }

  retry(): void {
    this.settlementResource.reload();
    this.breakdownResource.reload();
  }
}
