import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  TemplateRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Button } from '@shared/button/button';
import { ModalHandle, ModalService } from '@shared/modal/modal.service';
import { ToastService } from '@shared/toast/toast.service';
import type { TreatmentPlanResponse } from '../treatment-plan-models';
import { TreatmentPlansService } from '../treatment-plans.service';
import {
  PLAN_TRANSITION_SUCCESS_MESSAGES,
  PlanTransitionTarget,
  TREATMENT_PLAN_STATUS_ACTIONS,
  allowedPlanTransitions,
  requiresPlanTransitionConfirm,
} from '../treatment-plan-status';

const CONFIRM_COPY: Record<string, { title: string; question: string; confirmLabel: string }> = {
  rechazado: {
    title: 'Rechazar plan',
    question: '¿Rechazar este plan? El rechazo es un estado final y no se puede deshacer.',
    confirmLabel: 'Sí, rechazar plan',
  },
  abandonado: {
    title: 'Abandonar plan',
    question: '¿Abandonar este plan? El abandono es un estado final y no se puede deshacer.',
    confirmLabel: 'Sí, abandonar plan',
  },
};

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
  return 'No pudimos cambiar el estado. Intenta de nuevo.';
}

@Component({
  selector: 'app-treatment-plan-status-actions',
  imports: [Button],
  templateUrl: './treatment-plan-status-actions.html',
  host: { class: 'block' },
})
export class TreatmentPlanStatusActions {
  readonly plan = input.required<TreatmentPlanResponse>();
  readonly planUpdated = output<TreatmentPlanResponse>();

  private readonly plans = inject(TreatmentPlansService);
  private readonly modals = inject(ModalService);
  private readonly toasts = inject(ToastService);
  private readonly confirmTemplate = viewChild.required<TemplateRef<unknown>>('confirmTemplate');
  private confirmDialog: ModalHandle | null = null;

  readonly pending = signal<PlanTransitionTarget | null>(null);
  readonly confirmTarget = signal<PlanTransitionTarget | null>(null);
  readonly confirmError = signal<string | null>(null);

  readonly transitions = computed(() => allowedPlanTransitions(this.plan().status));
  readonly isFinal = computed(() => this.transitions().length === 0);
  readonly confirmCopy = computed(() => {
    const target = this.confirmTarget();
    return target ? (CONFIRM_COPY[target] ?? null) : null;
  });
  readonly actions = computed(() =>
    this.transitions().map((status) => {
      const meta = TREATMENT_PLAN_STATUS_ACTIONS[status];
      return {
        status,
        label: meta.label,
        variant: meta.variant,
        loading: this.pending() === status,
        disabled: this.pending() !== null,
      };
    }),
  );

  request(status: PlanTransitionTarget): void {
    if (this.pending()) {
      return;
    }
    if (requiresPlanTransitionConfirm(status)) {
      this.confirmTarget.set(status);
      this.confirmError.set(null);
      const copy = CONFIRM_COPY[status];
      this.confirmDialog = this.modals.open(this.confirmTemplate(), {
        title: copy?.title ?? 'Cambiar estado',
      });
      return;
    }
    void this.apply(status);
  }

  confirmChange(): void {
    const target = this.confirmTarget();
    if (target && !this.pending()) {
      this.confirmError.set(null);
      void this.apply(target);
    }
  }

  dismissConfirm(): void {
    this.closeConfirm();
  }

  private closeConfirm(): void {
    this.confirmDialog?.close();
    this.confirmDialog = null;
    this.confirmTarget.set(null);
  }

  private async apply(status: PlanTransitionTarget): Promise<void> {
    const { id } = this.plan();
    if (!id || this.pending()) {
      return;
    }
    const needsConfirm = requiresPlanTransitionConfirm(status);
    this.pending.set(status);
    try {
      const updated = await firstValueFrom(this.plans.updateStatus(id, status));
      if (needsConfirm) {
        this.closeConfirm();
      }
      this.planUpdated.emit(updated);
      this.toasts.success(PLAN_TRANSITION_SUCCESS_MESSAGES[status]);
    } catch (error) {
      const message = errorMessage(error);
      if (needsConfirm) {
        this.confirmError.set(message);
      } else {
        this.toasts.error(message);
      }
    } finally {
      this.pending.set(null);
    }
  }
}
