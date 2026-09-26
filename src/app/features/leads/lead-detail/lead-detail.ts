import { Component, computed, inject, input, signal, TemplateRef, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatCop } from '@features/treatment-plans/treatment-plan-models';
import { Button } from '@shared/button/button';
import { Icon } from '@shared/icon/icon';
import { Skeleton } from '@shared/skeleton/skeleton';
import { formatDateEs } from '@shared/table/table-models';
import { ModalHandle, ModalService } from '@shared/modal/modal.service';
import { ToastService } from '@shared/toast/toast.service';
import {
  LEAD_ACTIVITY_TYPE_META,
  LEAD_STAGE_META,
  LeadActivityResponse,
  LeadActivityType,
  LeadResponse,
  LeadStatus,
} from '../lead-models';
import { LeadActivityForm } from '../lead-activity-form/lead-activity-form';
import { LeadStageSelect } from '../lead-stage-select/lead-stage-select';
import { LeadsService } from '../leads.service';

@Component({
  selector: 'app-lead-detail',
  imports: [Button, Icon, LeadActivityForm, LeadStageSelect, RouterLink, Skeleton],
  templateUrl: './lead-detail.html',
  host: {
    class: 'block mx-auto max-w-5xl',
  },
})
export class LeadDetail {
  readonly id = input.required<string>();

  private readonly leads = inject(LeadsService);
  private readonly modals = inject(ModalService);
  private readonly toasts = inject(ToastService);
  private readonly activityTemplate = viewChild.required<TemplateRef<unknown>>('activityTemplate');
  private activityDialog: ModalHandle | null = null;

  readonly detail = this.leads.leadDetail(this.id);
  readonly history = this.leads.activities(this.id);

  readonly lead = computed<LeadResponse | null>(() => this.detail.value() ?? null);
  readonly loading = computed(() => this.detail.isLoading());
  readonly error = computed(() => this.detail.error() !== undefined);
  readonly historyLoading = computed(() => this.history.isLoading());
  readonly historyError = computed(() => this.history.error() !== undefined);

  // Activities logged in this session appear first, instantly.
  private readonly fresh = signal<ReadonlyArray<LeadActivityResponse>>([]);
  readonly timeline = computed<LeadActivityResponse[]>(() => [
    ...this.fresh(),
    ...(this.history.value() ?? []),
  ]);

  readonly stageMeta = computed(() => {
    const status = this.lead()?.status;
    return status && status in LEAD_STAGE_META
      ? LEAD_STAGE_META[status as LeadStatus]
      : LEAD_STAGE_META.nuevo;
  });

  activityMeta(type: LeadActivityType | string | null | undefined): { label: string; pill: string } {
    if (type && type in LEAD_ACTIVITY_TYPE_META) {
      const meta = LEAD_ACTIVITY_TYPE_META[type as LeadActivityType];
      return { label: meta.label, pill: `${meta.bgClass} ${meta.textClass}` };
    }
    return { label: type ?? 'Actividad', pill: 'bg-surface-alt text-ink-soft' };
  }

  formatPrice(val: number | null | undefined): string {
    return formatCop(val);
  }

  formatDate(date: string | null | undefined): string {
    return date ? formatDateEs(date) : '—';
  }

  retry(): void {
    this.detail.reload();
  }

  retryHistory(): void {
    this.history.reload();
  }

  onStageMoved(): void {
    this.detail.reload();
  }

  openActivity(): void {
    this.activityDialog = this.modals.open(this.activityTemplate(), {
      title: 'Registrar contacto',
    });
  }

  onActivityLogged(activity: LeadActivityResponse): void {
    this.activityDialog?.close();
    this.activityDialog = null;
    this.fresh.update((current) => [activity, ...current]);
    this.detail.reload();
    this.toasts.success('Contacto registrado.');
  }

  onActivityCancelled(): void {
    this.activityDialog?.close();
    this.activityDialog = null;
  }
}
