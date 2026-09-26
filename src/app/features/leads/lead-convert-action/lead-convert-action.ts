import { Component, TemplateRef, computed, inject, input, output, viewChild } from '@angular/core';
import { Button } from '@shared/button/button';
import { ModalHandle, ModalService } from '@shared/modal/modal.service';
import { ToastService } from '@shared/toast/toast.service';
import { ConvertLeadResponse, LeadResponse } from '../lead-models';
import { LeadConvertForm } from '../lead-convert-form/lead-convert-form';

@Component({
  selector: 'app-lead-convert-action',
  imports: [Button, LeadConvertForm],
  templateUrl: './lead-convert-action.html',
  host: { class: 'block' },
})
export class LeadConvertAction {
  readonly lead = input.required<LeadResponse>();
  readonly converted = output<ConvertLeadResponse>();

  private readonly modals = inject(ModalService);
  private readonly toasts = inject(ToastService);
  private readonly convertTemplate = viewChild.required<TemplateRef<unknown>>('convertTemplate');
  private dialog: ModalHandle | null = null;

  // Converted leads show the patient pill instead; no action needed.
  readonly canConvert = computed(() => !this.lead().convertedPatientId);

  open(): void {
    if (!this.canConvert()) {
      return;
    }
    this.dialog = this.modals.open(this.convertTemplate(), {
      title: 'Convertir en paciente',
    });
  }

  onConverted(response: ConvertLeadResponse): void {
    this.close();
    if (response.alreadyConverted) {
      this.toasts.info('El prospecto ya estaba convertido.');
    } else {
      const name = response.patient?.firstName ?? this.lead().fullName ?? 'Prospecto';
      this.toasts.success(`${name} ahora es paciente.`);
    }
    this.converted.emit(response);
  }

  onCancelled(): void {
    this.close();
  }

  private close(): void {
    this.dialog?.close();
    this.dialog = null;
  }
}
