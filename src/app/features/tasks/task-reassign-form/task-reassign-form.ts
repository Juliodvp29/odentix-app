import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { form, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { Button } from '@shared/button/button';
import { FormField } from '@shared/form-field/form-field';
import { Select, SelectOption } from '@shared/select/select';
import { TaskResponse, TenantMember } from '../task-models';
import { TasksService } from '../tasks.service';

interface ReassignFormModel {
  assignedTo: string;
}

function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 404) {
      return 'Ese responsable ya no pertenece a la clínica. Elige otro miembro.';
    }
    const body = error.error as { message?: unknown; error?: unknown } | null;
    if (typeof body?.message === 'string') {
      return body.message;
    }
    if (typeof body?.error === 'string') {
      return body.error;
    }
  }
  return 'No pudimos reasignar la tarea. Intenta de nuevo.';
}

@Component({
  selector: 'app-task-reassign-form',
  imports: [Button, FormField, Select],
  templateUrl: './task-reassign-form.html',
  host: { class: 'block' },
})
export class TaskReassignForm {
  readonly task = input.required<TaskResponse>();
  readonly members = input<ReadonlyArray<TenantMember>>([]);
  readonly reassigned = output<TaskResponse>();
  readonly cancelled = output<void>();

  private readonly tasks = inject(TasksService);

  readonly model = signal<ReassignFormModel>({ assignedTo: '' });
  readonly reassignForm = form(this.model, (schema) => {
    required(schema.assignedTo, { message: 'Elige un responsable.' });
  });
  readonly saving = signal(false);
  readonly serverError = signal<string | null>(null);

  readonly memberOptions = computed<ReadonlyArray<SelectOption>>(() =>
    this.members().map((member) => ({
      value: member.id ?? '',
      label: member.fullName || member.email || 'Miembro sin nombre',
    })),
  );

  submitReassign(): void {
    this.serverError.set(null);
    submit(this.reassignForm, () => this.save());
  }

  cancel(): void {
    if (!this.saving()) {
      this.cancelled.emit();
    }
  }

  private async save(): Promise<void> {
    const id = this.task().id;
    const assignedTo = this.model().assignedTo;
    if (!id || !assignedTo || assignedTo === this.task().assignedTo) {
      return;
    }
    this.saving.set(true);
    try {
      const updated = await firstValueFrom(this.tasks.reassignTask(id, assignedTo));
      this.reassigned.emit(updated);
    } catch (error) {
      this.serverError.set(errorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }
}
