import { Component, TemplateRef, computed, inject, input, output, viewChild } from '@angular/core';
import { SessionService } from '@core/auth/session.service';
import { formatCop } from '@features/treatment-plans/treatment-plan-models';
import { Button } from '@shared/button/button';
import { ModalHandle, ModalService } from '@shared/modal/modal.service';
import { ToastService } from '@shared/toast/toast.service';
import { InvoiceResponse, PaymentResponse } from '../billing-models';
import { PaymentCreateForm } from '../payment-create/payment-create-form';

@Component({
  selector: 'app-payment-create-action',
  imports: [Button, PaymentCreateForm],
  templateUrl: './payment-create-action.html',
  host: { class: 'block' },
})
export class PaymentCreateAction {
  readonly invoice = input.required<InvoiceResponse>();
  readonly paid = output<PaymentResponse>();

  private readonly session = inject(SessionService);
  private readonly modals = inject(ModalService);
  private readonly toasts = inject(ToastService);
  private readonly createTemplate = viewChild.required<TemplateRef<unknown>>('createTemplate');
  private dialog: ModalHandle | null = null;

  // The backend only allows payments to clinical and front-desk roles,
  // and only invoices awaiting payment accept them.
  readonly canRegister = computed(
    () => this.session.currentUser()?.role !== 'especialista_externo',
  );
  readonly canPay = computed(() => {
    const status = this.invoice().status;
    return status === 'pendiente' || status === 'parcial';
  });
  readonly finalNote = computed(() =>
    this.invoice().status === 'pagada'
      ? 'Factura pagada — sin pagos pendientes.'
      : 'Factura anulada — no admite pagos.',
  );

  open(): void {
    if (!this.canRegister() || !this.canPay()) {
      return;
    }
    this.dialog = this.modals.open(this.createTemplate(), {
      title: 'Registrar pago',
    });
  }

  onPaid(payment: PaymentResponse): void {
    this.close();
    this.toasts.success(`Pago de ${formatCop(payment.amountCop)} registrado.`);
    this.paid.emit(payment);
  }

  onCancelled(): void {
    this.close();
  }

  private close(): void {
    this.dialog?.close();
    this.dialog = null;
  }
}
