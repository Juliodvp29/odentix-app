import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SessionService } from '@core/auth/session.service';
import { Button } from '@shared/button/button';
import { Icon } from '@shared/icon/icon';
import { Skeleton } from '@shared/skeleton/skeleton';
import { ToastService } from '@shared/toast/toast.service';
import { formatCurrencyCop } from '@shared/table/table-models';
import {
  BillingCycle,
  PlanCatalogResponse,
  featureLabel,
  isCurrentPlan,
  limitLabel,
  limitValueLabel,
} from '../plan-models';
import { PlanService } from '../plan.service';

function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 403) {
    return 'Solo el propietario puede cambiar el plan.';
  }
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { message?: unknown; error?: unknown } | null;
    if (typeof body?.message === 'string') {
      return body.message;
    }
    if (typeof body?.error === 'string') {
      return body.error;
    }
  }
  return 'No pudimos iniciar el pago. Intenta de nuevo.';
}

// Plan catalog with upgrade checkout. Everything on screen comes from
// the backend catalog endpoint: prices, features and limits are never
// hardcoded here. Choosing a plan starts a Bold checkout and leaves to
// the payment URL; only the owner can start one.
@Component({
  selector: 'app-plan-selection',
  imports: [Button, Icon, Skeleton],
  templateUrl: './plan-selection.html',
  host: { class: 'block space-y-24' },
})
export class PlanSelection {
  private readonly billing = inject(PlanService);
  private readonly session = inject(SessionService);
  private readonly toasts = inject(ToastService);
  private readonly document = inject(DOCUMENT);

  private readonly catalogResource = this.billing.catalog();

  readonly cycle = signal<BillingCycle>('monthly');
  readonly checkingOut = signal<string | null>(null);

  readonly loading = computed(() => this.catalogResource.isLoading());
  readonly loadError = computed(() => this.catalogResource.error() !== undefined);
  readonly plans = computed<PlanCatalogResponse[]>(() => this.catalogResource.value() ?? []);
  readonly currentCode = computed(() => this.billing.plan()?.planCode ?? null);
  readonly isOwner = computed(() => this.session.currentUser()?.role === 'propietario');
  readonly currentPlan = computed(
    () => this.plans().find((plan) => isCurrentPlan(plan.code, this.currentCode())) ?? null,
  );

  price(plan: PlanCatalogResponse): string {
    const amount = this.cycle() === 'annual' ? plan.annualPriceCop : plan.monthlyPriceCop;
    return formatCurrencyCop(Number(amount ?? 0));
  }

  featureLabels(plan: PlanCatalogResponse): ReadonlyArray<string> {
    return (plan.features ?? []).map(featureLabel);
  }

  limitEntries(plan: PlanCatalogResponse): ReadonlyArray<{ label: string; value: string }> {
    return Object.entries(plan.limits ?? {}).map(([key, value]) => ({
      label: limitLabel(key),
      value: limitValueLabel(value),
    }));
  }

  isCurrent(plan: PlanCatalogResponse): boolean {
    return isCurrentPlan(plan.code, this.currentCode());
  }

  isCheckingOut(plan: PlanCatalogResponse): boolean {
    return this.checkingOut() === plan.code;
  }

  showCycle(cycle: BillingCycle): void {
    this.cycle.set(cycle);
  }

  retry(): void {
    this.catalogResource.reload();
  }

  async choose(plan: PlanCatalogResponse): Promise<void> {
    const code = plan.code;
    if (!code || !this.isOwner() || this.isCurrent(plan) || this.checkingOut()) {
      return;
    }
    this.checkingOut.set(code);
    try {
      const checkout = await firstValueFrom(this.billing.checkout(code, this.cycle()));
      if (checkout.paymentUrl) {
        this.document.location.href = checkout.paymentUrl;
      } else {
        this.checkingOut.set(null);
        this.toasts.error('El cobro no devolvió un link de pago. Intenta de nuevo.');
      }
    } catch (error) {
      this.checkingOut.set(null);
      this.toasts.error(errorMessage(error));
    }
  }
}
