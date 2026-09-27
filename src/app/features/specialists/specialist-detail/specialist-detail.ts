import { Component, computed, inject, input, TemplateRef, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { formatCop } from '@features/treatment-plans/treatment-plan-models';
import { Button } from '@shared/button/button';
import { Icon } from '@shared/icon/icon';
import { Skeleton } from '@shared/skeleton/skeleton';
import { ModalHandle, ModalService } from '@shared/modal/modal.service';
import { ToastService } from '@shared/toast/toast.service';
import {
  SETTLEMENT_STATUS_META,
  SettlementResponse,
  SettlementStatus,
  SpecialistResponse,
  specialistInitials,
} from '../specialist-models';
import { SettlementGenerateForm } from '../settlement-generate-form/settlement-generate-form';
import { SettlementsService, isPlanGateError } from '../settlements.service';

@Component({
  selector: 'app-specialist-detail',
  imports: [Button, Icon, RouterLink, SettlementGenerateForm, Skeleton],
  templateUrl: './specialist-detail.html',
  host: {
    class: 'block mx-auto max-w-5xl',
  },
})
export class SpecialistDetail {
  readonly id = input.required<string>();

  private readonly settlementsService = inject(SettlementsService);
  private readonly modals = inject(ModalService);
  private readonly toasts = inject(ToastService);
  private readonly router = inject(Router);
  private readonly generateTemplate =
    viewChild.required<TemplateRef<unknown>>('generateTemplate');
  private generateDialog: ModalHandle | null = null;

  private readonly specialistId = computed(() => this.id());
  private readonly listResource = this.settlementsService.specialists();
  private readonly historyResource = this.settlementsService.settlements(this.specialistId);

  readonly specialist = computed<SpecialistResponse | null>(
    () => this.listResource.value()?.find((item) => item.id === this.id()) ?? null,
  );
  readonly loading = computed(() => this.listResource.isLoading());
  readonly planGated = computed(() => isPlanGateError(this.listResource.error()));
  readonly loadFailed = computed(
    () => !this.planGated() && this.listResource.error() !== undefined,
  );
  readonly history = computed<SettlementResponse[]>(() => this.historyResource.value() ?? []);
  readonly historyLoading = computed(() => this.historyResource.isLoading());
  readonly historyFailed = computed(() => this.historyResource.error() !== undefined);

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

  initials(name: string | null | undefined): string {
    return specialistInitials(name);
  }

  feeLabel(fee: number | null | undefined): string {
    return `${Number(fee ?? 0)} %`;
  }

  formatPrice(val: number | null | undefined): string {
    return formatCop(val);
  }

  retry(): void {
    this.listResource.reload();
  }

  retryHistory(): void {
    this.historyResource.reload();
  }

  openGenerate(): void {
    this.generateDialog = this.modals.open(this.generateTemplate(), {
      title: 'Generar liquidación',
    });
  }

  onGenerated(settlement: SettlementResponse): void {
    this.closeGenerate();
    this.toasts.success('Liquidación generada.');
    if (settlement.id) {
      void this.router.navigate(['/specialists', this.id(), 'settlements', settlement.id]);
    } else {
      this.historyResource.reload();
    }
  }

  onAlreadyExists(): void {
    this.closeGenerate();
    this.toasts.info('Ese periodo ya fue liquidado.');
    this.historyResource.reload();
  }

  onGenerateCancelled(): void {
    this.closeGenerate();
  }

  private closeGenerate(): void {
    this.generateDialog?.close();
    this.generateDialog = null;
  }
}
