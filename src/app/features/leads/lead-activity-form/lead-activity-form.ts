import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, output, signal } from '@angular/core';
import { form, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { Button } from '@shared/button/button';
import { FormField } from '@shared/form-field/form-field';
import { Select } from '@shared/select/select';
import { TextInput } from '@shared/text-input/text-input';
import {
  CreateLeadActivityRequest,
  LEAD_ACTIVITY_TYPES,
  LEAD_ACTIVITY_TYPE_META,
  LeadActivityResponse,
  LeadActivityType,
} from '../lead-models';
import { LeadsService } from '../leads.service';

interface LeadActivityFormModel {
  activityType: string;
  notes: string;
}

function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { message?: unknown; error?: unknown } | null;
    if (typeof body?.message === 'string') {
      return body.message;
    }
    if (typeof body?.error === 'string') {
      return body.error;
    }
  }
  return 'No pudimos registrar el contacto. Intenta de nuevo.';
}

@Component({
  selector: 'app-lead-activity-form',
  imports: [Button, FormField, Select, TextInput],
  templateUrl: './lead-activity-form.html',
  host: { class: 'block' },
})
export class LeadActivityForm {
  readonly leadId = input.required<string>();
  readonly logged = output<LeadActivityResponse>();
  readonly cancelled = output<void>();

  private readonly leads = inject(LeadsService);

  readonly typeOptions = LEAD_ACTIVITY_TYPES.map((type) => ({
    value: type,
    label: LEAD_ACTIVITY_TYPE_META[type].label,
  }));

  readonly model = signal<LeadActivityFormModel>({ activityType: '', notes: '' });
  readonly activityForm = form(this.model, (schema) => {
    required(schema.activityType, { message: 'El tipo de contacto es obligatorio.' });
  });
  readonly saving = signal(false);
  readonly serverError = signal<string | null>(null);

  submitActivity(): void {
    this.serverError.set(null);
    submit(this.activityForm, () => this.save());
  }

  cancel(): void {
    if (!this.saving()) {
      this.cancelled.emit();
    }
  }

  private async save(): Promise<void> {
    const leadId = this.leadId();
    if (!leadId) {
      return;
    }
    const model = this.model();
    const body: CreateLeadActivityRequest = {
      activityType: model.activityType as LeadActivityType,
    };
    if (model.notes.trim()) {
      body.notes = model.notes.trim();
    }
    this.saving.set(true);
    try {
      const activity = await firstValueFrom(this.leads.addActivity(leadId, body));
      if (!activity) {
        throw new Error('Empty response');
      }
      this.logged.emit(activity);
    } catch (error) {
      this.serverError.set(errorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }
}
