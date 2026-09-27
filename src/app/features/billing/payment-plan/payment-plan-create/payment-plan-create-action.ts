import { Component, TemplateRef, computed, inject, input, output, viewChild } from '@angular/core';
import { SessionService } from '@core/auth/session.service';
import type { TreatmentPlanResponse } from '@features/treatment-plans/treatment-plan-models';
import { Button } from '@shared/button/button';
import { ModalHandle, ModalService } from '@shared/modal/modal.service';
import { ToastService } from '@shared/toast/toast.service';
import { PaymentPlanResponse } from '../payment-plan-models';
import { PaymentPlanCreateForm } from './payment-plan-create-form';

@Component({
  selector: 'app-payment-plan-create-action',
  imports: [Button, PaymentPlanCreateForm],
  templateUrl: './payment-plan-create-action.html',
  host: { class: 'block' },
})
export class PaymentPlanCreateAction {
  readonly treatmentPlan = input.required<TreatmentPlanResponse>();
  readonly created = output<PaymentPlanResponse>();
  readonly alreadyExists = output<void>();

  private readonly session = inject(SessionService);
  private readonly modals = inject(ModalService);
  private readonly toasts = inject(ToastService);
  private readonly createTemplate = viewChild.required<TemplateRef<unknown>>('createTemplate');
  private dialog: ModalHandle | null = null;

  // The backend only allows payment plans to clinical and front-desk roles.
  readonly canCreate = computed(
    () => this.session.currentUser()?.role !== 'especialista_externo',
  );

  open(): void {
    if (!this.canCreate()) {
      return;
    }
    this.dialog = this.modals.open(this.createTemplate(), {
      title: 'Crear plan de pago',
    });
  }

  onCreated(plan: PaymentPlanResponse): void {
    this.close();
    this.toasts.success(`Plan de pago creado (${plan.installmentsCount ?? 0} cuotas).`);
    this.created.emit(plan);
  }

  onAlreadyExists(): void {
    this.close();
    this.toasts.info('El plan ya tiene un plan de pago.');
    this.alreadyExists.emit();
  }

  onCancelled(): void {
    this.close();
  }

  private close(): void {
    this.dialog?.close();
    this.dialog = null;
  }
}
