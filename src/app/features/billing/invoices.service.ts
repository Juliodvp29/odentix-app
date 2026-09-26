import { HttpResourceRef, httpResource } from '@angular/common/http';
import { Injectable, Signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '@core/api/api-client';
import { CreateInvoiceRequest, InvoiceResponse } from './billing-models';

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  private readonly api = inject(ApiClient);

  // Generates an invoice from a treatment plan. When discountCop is
  // omitted the backend defaults to the sum of the plan discounts.
  createInvoice(treatmentPlanId: string, discountCop?: number): Observable<InvoiceResponse> {
    const body: CreateInvoiceRequest = { treatmentPlanId };
    if (discountCop !== undefined) {
      body.discountCop = discountCop;
    }
    return this.api.post<CreateInvoiceRequest, InvoiceResponse>('/api/v1/invoices', body);
  }

  // Fetches a single invoice with its line items.
  getInvoice(id: string): Observable<InvoiceResponse> {
    return this.api.get<InvoiceResponse>(`/api/v1/invoices/${id}`);
  }

  // Reactive resource for a single invoice detail.
  detail(id: Signal<string>): HttpResourceRef<InvoiceResponse | undefined> {
    return httpResource<InvoiceResponse>(() => {
      const invoiceId = id();
      return invoiceId ? { url: this.api.url(`/api/v1/invoices/${invoiceId}`) } : undefined;
    });
  }
}
