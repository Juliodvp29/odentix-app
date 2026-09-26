import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatCop } from '@features/treatment-plans/treatment-plan-models';
import { Button } from '@shared/button/button';
import { Icon } from '@shared/icon/icon';
import { Skeleton } from '@shared/skeleton/skeleton';
import { formatDateEs } from '@shared/table/table-models';
import {
  InvoiceItemResponse,
  InvoiceResponse,
  invoiceComputedTotal,
  sumLines,
} from '../billing-models';
import { InvoiceStatusPill } from '../invoice-status-pill/invoice-status-pill';
import { InvoicesService } from '../invoices.service';

@Component({
  selector: 'app-invoice-detail',
  imports: [Button, Icon, InvoiceStatusPill, RouterLink, Skeleton],
  templateUrl: './invoice-detail.html',
  host: {
    class: 'block mx-auto max-w-5xl',
  },
})
export class InvoiceDetail {
  readonly id = input.required<string>();

  private readonly invoices = inject(InvoicesService);

  readonly detail = this.invoices.detail(this.id);
  readonly invoice = computed<InvoiceResponse | null>(() => this.detail.value() ?? null);
  readonly loading = computed(() => this.detail.isLoading());
  readonly error = computed(() => this.detail.error() !== undefined);

  readonly items = computed<InvoiceItemResponse[]>(() => this.invoice()?.items ?? []);
  // Recomputed from the visible lines so the totals block always shows
  // where the numbers come from instead of asking for blind trust.
  readonly linesSubtotal = computed(() => sumLines(this.items()));
  readonly computedTotal = computed(() =>
    invoiceComputedTotal(this.linesSubtotal(), this.invoice()?.discountCop ?? 0),
  );

  formatPrice(val: number | null | undefined): string {
    return formatCop(val);
  }

  formatDate(date: string | null | undefined): string {
    return date ? formatDateEs(date) : '—';
  }

  retry(): void {
    this.detail.reload();
  }
}
