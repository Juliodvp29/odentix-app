import {
  Component,
  TemplateRef,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { formatCop } from '@features/treatment-plans/treatment-plan-models';
import type { TreatmentPlanResponse } from '@features/treatment-plans/treatment-plan-models';
import { Button } from '@shared/button/button';
import { Skeleton } from '@shared/skeleton/skeleton';
import { formatDateEs } from '@shared/table/table-models';
import { ModalHandle, ModalService } from '@shared/modal/modal.service';
import { ToastService } from '@shared/toast/toast.service';
import {
  INSTALLMENT_STATUS_META,
  InstallmentResponse,
  InstallmentStatus,
  PaymentPlanResponse,
  canPayInstallment,
  isPaidInstallment,
  sumInstallments,
} from '../payment-plan-models';
import { PaymentPlanCreateAction } from '../payment-plan-create/payment-plan-create-action';
import { PaymentPlansService, isNotFoundError, isPlanGateError } from '../payment-plans.service';

function payErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 409) {
      return 'La cuota ya fue pagada.';
    }
    const body = error.error as { message?: unknown; error?: unknown } | null;
    if (typeof body?.message === 'string') {
      return body.message;
    }
    if (typeof body?.error === 'string') {
      return body.error;
    }
  }
  return 'No pudimos registrar el pago. Intenta de nuevo.';
}

@Component({
  selector: 'app-payment-plan-section',
  imports: [Button, PaymentPlanCreateAction, Skeleton],
  templateUrl: './payment-plan-section.html',
  host: { class: 'block' },
})
export class PaymentPlanSection {
  readonly treatmentPlan = input.required<TreatmentPlanResponse>();

  private readonly paymentPlans = inject(PaymentPlansService);
  private readonly modals = inject(ModalService);
  private readonly toasts = inject(ToastService);
  private readonly payTemplate = viewChild.required<TemplateRef<unknown>>('payTemplate');
  private payDialog: ModalHandle | null = null;

  private readonly planId = computed(() => this.treatmentPlan().id ?? '');
  readonly resource = this.paymentPlans.paymentPlan(this.planId);

  readonly loading = computed(() => this.resource.isLoading());
  readonly planGated = computed(() => isPlanGateError(this.resource.error()));
  readonly missing = computed(() => isNotFoundError(this.resource.error()));
  readonly loadFailed = computed(
    () => !this.planGated() && !this.missing() && this.resource.error() !== undefined,
  );

  readonly plan = computed<PaymentPlanResponse | null>(() => this.resource.value() ?? null);

  // Paid installments apply instantly without waiting for a refetch.
  private readonly paidOverrides = signal<ReadonlyMap<string, InstallmentResponse>>(new Map());
  readonly installments = computed<InstallmentResponse[]>(() =>
    (this.plan()?.installments ?? []).map(
      (installment) =>
        (installment.id && this.paidOverrides().get(installment.id)) || installment,
    ),
  );

  readonly paidCount = computed(
    () => this.installments().filter((item) => isPaidInstallment(item.status)).length,
  );
  readonly paidAmount = computed(() =>
    sumInstallments(this.installments().filter((item) => isPaidInstallment(item.status))),
  );
  readonly balance = computed(
    () => Math.max(0, (this.plan()?.totalAmountCop ?? 0) - this.paidAmount()),
  );
  readonly progressWidth = computed(() => {
    const total = this.installments().length;
    return total === 0 ? '0%' : `${Math.round((this.paidCount() / total) * 100)}%`;
  });

  readonly pendingInstallment = signal<InstallmentResponse | null>(null);
  readonly paying = signal(false);
  readonly payError = signal<string | null>(null);

  installmentMeta(status: InstallmentStatus | string | null | undefined): {
    label: string;
    pill: string;
  } {
    if (status && status in INSTALLMENT_STATUS_META) {
      const meta = INSTALLMENT_STATUS_META[status as InstallmentStatus];
      return { label: meta.label, pill: `${meta.bgClass} ${meta.textClass}` };
    }
    return { label: status ?? '—', pill: 'bg-surface-alt text-ink-soft' };
  }

  canPay(status: InstallmentStatus | string | null | undefined): boolean {
    return canPayInstallment(status);
  }

  formatPrice(val: number | null | undefined): string {
    return formatCop(val);
  }

  formatDate(date: string | null | undefined): string {
    return date ? formatDateEs(date) : '—';
  }

  retry(): void {
    this.resource.reload();
  }

  onPlanChanged(): void {
    this.paidOverrides.set(new Map());
    this.resource.reload();
  }

  requestPay(installment: InstallmentResponse): void {
    if (this.paying()) {
      return;
    }
    this.pendingInstallment.set(installment);
    this.payError.set(null);
    this.payDialog = this.modals.open(this.payTemplate(), { title: 'Pagar cuota' });
  }

  dismissPay(): void {
    if (!this.paying()) {
      this.closePay();
    }
  }

  async confirmPay(): Promise<void> {
    const installment = this.pendingInstallment();
    if (!installment?.id || this.paying()) {
      return;
    }
    this.paying.set(true);
    this.payError.set(null);
    try {
      const updated = await firstValueFrom(this.paymentPlans.payInstallment(installment.id));
      this.paidOverrides.update((current) => new Map(current).set(installment.id as string, updated));
      this.closePay();
      this.toasts.success(
        `Cuota ${installment.installmentNumber ?? ''} pagada. Se generó su factura automáticamente.`.trim(),
      );
    } catch (error) {
      this.payError.set(payErrorMessage(error));
    } finally {
      this.paying.set(false);
    }
  }

  private closePay(): void {
    this.payDialog?.close();
    this.payDialog = null;
    this.pendingInstallment.set(null);
  }
}
