import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Select, SelectOption } from '@shared/select/select';
import { ToastService } from '@shared/toast/toast.service';
import { LEAD_STAGES, LEAD_STAGE_META, LeadStatus } from '../lead-models';
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
  return 'No pudimos mover el prospecto. Intenta de nuevo.';
}

// Shared pipeline-stage picker used by the board card and the lead
// detail: same PATCH, same toast, no duplicated logic.
@Component({
  selector: 'app-lead-stage-select',
  imports: [Select],
  templateUrl: './lead-stage-select.html',
  host: { class: 'block' },
})
export class LeadStageSelect {
  readonly leadId = input.required<string | null | undefined>();
  readonly status = input.required<LeadStatus | string | null | undefined>();
  readonly leadName = input<string | null | undefined>(null);
  readonly moved = output<{ id: string; status: LeadStatus }>();

  private readonly leads = inject(LeadsService);
  private readonly toasts = inject(ToastService);

  readonly moving = signal(false);

  readonly stageOptions = computed<ReadonlyArray<SelectOption>>(() =>
    LEAD_STAGES.map((stage) => ({ value: stage, label: LEAD_STAGE_META[stage].label })),
  );

  async moveTo(target: string): Promise<void> {
    const id = this.leadId();
    const from = this.status();
    if (!id || !target || target === from || this.moving()) {
      return;
    }
    this.moving.set(true);
    try {
      const updated = await firstValueFrom(
        this.leads.updateLeadStatus(id, target as LeadStatus),
      );
      if (updated.status) {
        this.moved.emit({ id, status: updated.status as LeadStatus });
      }
      const toLabel = LEAD_STAGE_META[target as LeadStatus]?.label ?? target;
      this.toasts.success(`${this.leadName() ?? 'Prospecto'} movido a ${toLabel}.`);
    } catch (error) {
      this.toasts.error(errorMessage(error));
    } finally {
      this.moving.set(false);
    }
  }
}
