import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { formatCop } from '@features/treatment-plans/treatment-plan-models';
import { Select, SelectOption } from '@shared/select/select';
import { ToastService } from '@shared/toast/toast.service';
import { formatDateEs } from '@shared/table/table-models';
import {
  LEAD_STAGES,
  LEAD_STAGE_META,
  LeadResponse,
  LeadStatus,
  assigneeInitials,
} from '../lead-models';
import { LeadsService } from '../leads.service';

function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { message?: unknown; error?: unknown } | null;
    if (typeof body?.message === 'string') {
      return body.message;
    }
    if (typeof body?.error === 'string') {
      return body.error;
    }
  }
  return 'No pudimos mover el lead. Intenta de nuevo.';
}

@Component({
  selector: 'app-lead-card',
  imports: [RouterLink, Select],
  templateUrl: './lead-card.html',
  host: { class: 'block' },
})
export class LeadCard {
  readonly lead = input.required<LeadResponse>();
  readonly moved = output<LeadResponse>();

  private readonly leads = inject(LeadsService);
  private readonly toasts = inject(ToastService);

  readonly moving = signal(false);

  readonly stageOptions = computed<ReadonlyArray<SelectOption>>(() =>
    LEAD_STAGES.map((stage) => ({ value: stage, label: LEAD_STAGE_META[stage].label })),
  );
  readonly initials = computed(() => assigneeInitials(this.lead().assignedToName));

  formatValue(val: number | null | undefined): string {
    return formatCop(val);
  }

  formatDate(date: string | null | undefined): string {
    return date ? formatDateEs(date) : '—';
  }

  async moveTo(target: string): Promise<void> {
    const lead = this.lead();
    const from = lead.status;
    if (!lead.id || !target || target === from || this.moving()) {
      return;
    }
    this.moving.set(true);
    try {
      const updated = await firstValueFrom(
        this.leads.updateLeadStatus(lead.id, target as LeadStatus),
      );
      this.moved.emit(updated);
      const toLabel = LEAD_STAGE_META[target as LeadStatus]?.label ?? target;
      this.toasts.success(`${lead.fullName ?? 'Prospecto'} movido a ${toLabel}.`);
    } catch (error) {
      this.toasts.error(errorMessage(error));
    } finally {
      this.moving.set(false);
    }
  }
}
