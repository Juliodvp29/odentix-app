import { Component, computed, inject, signal } from '@angular/core';
import { Button } from '@shared/button/button';
import { Icon } from '@shared/icon/icon';
import { Skeleton } from '@shared/skeleton/skeleton';
import {
  LEAD_STAGES,
  LEAD_STAGE_META,
  LeadStatus,
  groupLeadsByStage,
} from '../lead-models';
import { LeadsService, isPlanGateError } from '../leads.service';
import { LeadCard } from './lead-card';

@Component({
  selector: 'app-leads-board',
  imports: [Button, Icon, LeadCard, Skeleton],
  templateUrl: './leads-board.html',
  host: { class: 'block space-y-24' },
})
export class LeadsBoard {
  private readonly leads = inject(LeadsService);
  private readonly page = this.leads.boardPage();

  readonly loading = computed(() => this.page.isLoading());
  readonly planGated = computed(() => isPlanGateError(this.page.error()));
  readonly loadFailed = computed(() => !this.planGated() && this.page.error() !== undefined);

  readonly total = computed(() => this.page.value()?.totalElements ?? 0);
  readonly fetched = computed(() => this.page.value()?.content?.length ?? 0);
  readonly truncated = computed(() => this.total() > this.fetched());

  // Instant regrouping after a move, without waiting for a refetch.
  private readonly overrides = signal<ReadonlyMap<string, LeadStatus>>(new Map());
  readonly grouped = computed(() =>
    groupLeadsByStage(
      (this.page.value()?.content ?? []).map((lead) => {
        const status = lead.id ? this.overrides().get(lead.id) : undefined;
        return status && status !== lead.status ? { ...lead, status } : lead;
      }),
    ),
  );

  readonly columns = computed(() =>
    LEAD_STAGES.map((stage) => ({
      stage,
      label: LEAD_STAGE_META[stage].label,
      bgClass: LEAD_STAGE_META[stage].bgClass,
      textClass: LEAD_STAGE_META[stage].textClass,
      leads: this.grouped()[stage],
    })),
  );

  onMoved(updated: { id: string; status: LeadStatus }): void {
    this.overrides.update((current) => new Map(current).set(updated.id, updated.status));
  }

  retry(): void {
    this.page.reload();
  }
}
