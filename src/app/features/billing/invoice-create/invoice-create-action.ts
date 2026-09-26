import { Component, TemplateRef, computed, inject, input, output, viewChild } from '@angular/core';
import { SessionService } from '@core/auth/session.service';
import type { TreatmentPlanResponse } from '@features/treatment-plans/treatment-plan-models';
import { Button } from '@shared/button/button';
import { ModalHandle, ModalService } from '@shared/modal/modal.service';
import { ToastService } from '@shared/toast/toast.service';
import { InvoiceResponse } from '../billing-models';
import { InvoiceCreateForm } from '../invoice-create/invoice-create-form';

@Component({
  selector: 'app-invoice-create-action',
  imports: [Button, InvoiceCreateForm],
  templateUrl: './invoice-create-action.html',
  host: { class: 'block' },
})
export class InvoiceCreateAction {
  readonly plan = input.required<TreatmentPlanResponse>();
  readonly created = output<InvoiceResponse>();

  private readonly session = inject(SessionService);
  private readonly modals = inject(ModalService);
  private readonly toasts = inject(ToastService);
  private readonly createTemplate = viewChild.required<TemplateRef<unknown>>('createTemplate');
  private dialog: ModalHandle | null = null;

  // The backend only allows invoicing to clinical and front-desk roles.
  readonly canInvoice = computed(
    () => this.session.currentUser()?.role !== 'especialista_externo',
  );
  readonly hasItems = computed(() => (this.plan().items ?? []).length > 0);

  open(): void {
    if (!this.canInvoice() || !this.hasItems()) {
      return;
    }
    this.dialog = this.modals.open(this.createTemplate(), {
      title: 'Generar factura',
    });
  }

  onCreated(invoice: InvoiceResponse): void {
    this.close();
    this.toasts.success(`Factura ${invoice.invoiceNumber ?? ''} generada.`.trim());
    this.created.emit(invoice);
  }

  onCancelled(): void {
    this.close();
  }

  private close(): void {
    this.dialog?.close();
    this.dialog = null;
  }
}
