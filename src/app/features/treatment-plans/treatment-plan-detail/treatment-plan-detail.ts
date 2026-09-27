import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { InvoiceCreateAction } from '@features/billing/invoice-create/invoice-create-action';
import { InvoiceStatusPill } from '@features/billing/invoice-status-pill/invoice-status-pill';
import { InvoicesService } from '@features/billing/invoices.service';
import { PaymentPlanSection } from '@features/billing/payment-plan/payment-plan-section/payment-plan-section';
import type { InvoiceResponse } from '@features/billing/billing-models';
import { Button } from '@shared/button/button';
import { Icon } from '@shared/icon/icon';
import { Skeleton } from '@shared/skeleton/skeleton';
import { formatDateEs } from '@shared/table/table-models';
import {
  TreatmentPlanItemResponse,
  TreatmentPlanResponse,
  formatCop,
} from '../treatment-plan-models';
import { TreatmentPlanStatusPill } from '../treatment-plan-status-pill/treatment-plan-status-pill';
import { TreatmentPlanStatusActions } from '../treatment-plan-status-actions/treatment-plan-status-actions';
import { TreatmentPlansService } from '../treatment-plans.service';

@Component({
  selector: 'app-treatment-plan-detail',
  imports: [
    Button,
    Icon,
    InvoiceCreateAction,
    InvoiceStatusPill,
    PaymentPlanSection,
    RouterLink,
    Skeleton,
    TreatmentPlanStatusActions,
    TreatmentPlanStatusPill,
  ],
  templateUrl: './treatment-plan-detail.html',
  host: {
    class: 'block mx-auto max-w-5xl',
  },
})
export class TreatmentPlanDetail {
  readonly id = input.required<string>();

  private readonly plansService = inject(TreatmentPlansService);
  private readonly invoicesService = inject(InvoicesService);
  private readonly router = inject(Router);

  readonly detail = this.plansService.detail(this.id);
  readonly plan = computed<TreatmentPlanResponse | null>(() => this.detail.value() ?? null);
  readonly loading = computed(() => this.detail.isLoading());
  readonly error = computed(() => this.detail.error() !== undefined);

  readonly items = computed<TreatmentPlanItemResponse[]>(() => this.plan()?.items ?? []);

  // Invoices already issued for this plan. The backend has no per-plan
  // filter, so the patient's page is filtered client-side. When at least
  // one exists, invoicing is blocked: a from-plan invoice always bills
  // the full items, so a second one would double-bill the patient.
  private readonly patientId = computed(() => this.plan()?.patientId ?? '');
  private readonly invoicesPage = this.invoicesService.patientInvoices(this.patientId);
  readonly invoicesLoading = computed(() => this.invoicesPage.isLoading());
  readonly existingInvoices = computed<InvoiceResponse[]>(() => {
    const planId = this.plan()?.id;
    if (!planId) return [];
    return (this.invoicesPage.value()?.content ?? []).filter(
      (invoice) => invoice.treatmentPlanId === planId,
    );
  });
  readonly alreadyInvoiced = computed(() => this.existingInvoices().length > 0);

  formatPrice(val: number | null | undefined): string {
    return formatCop(val);
  }

  formatDate(date: string | null | undefined): string {
    return date ? formatDateEs(date) : '—';
  }

  retry(): void {
    this.detail.reload();
  }

  onPlanUpdated(): void {
    this.detail.reload();
  }

  goToInvoice(invoice: InvoiceResponse): void {
    if (invoice.id) {
      void this.router.navigate(['/billing', invoice.id]);
    }
  }
}
