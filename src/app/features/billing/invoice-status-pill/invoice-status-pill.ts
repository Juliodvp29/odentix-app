import { Component, computed, input } from '@angular/core';
import { INVOICE_STATUS_META, InvoiceStatus } from '../billing-models';

@Component({
  selector: 'app-invoice-status-pill',
  templateUrl: './invoice-status-pill.html',
  host: {
    class: 'inline-flex items-center',
  },
})
export class InvoiceStatusPill {
  readonly status = input.required<InvoiceStatus | string | null | undefined>();

  readonly meta = computed(() => {
    const raw = this.status();
    if (raw && raw in INVOICE_STATUS_META) {
      return INVOICE_STATUS_META[raw as InvoiceStatus];
    }
    return INVOICE_STATUS_META.pendiente;
  });
}
