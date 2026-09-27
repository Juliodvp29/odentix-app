import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, output, signal } from '@angular/core';
import { form, min, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { Button } from '@shared/button/button';
import { FormField } from '@shared/form-field/form-field';
import { TextInput } from '@shared/text-input/text-input';
import { CreateInventoryItemRequest } from '../inventory-models';
import { InventoryService } from '../inventory.service';

interface InventoryItemFormModel {
  name: string;
  unit: string;
  minThreshold: number;
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
  return 'No pudimos crear el insumo. Intenta de nuevo.';
}

@Component({
  selector: 'app-inventory-item-form',
  imports: [Button, FormField, TextInput],
  templateUrl: './inventory-item-form.html',
  host: { class: 'block' },
})
export class InventoryItemForm {
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  private readonly inventory = inject(InventoryService);

  readonly model = signal<InventoryItemFormModel>({ name: '', unit: '', minThreshold: 0 });
  readonly itemForm = form(this.model, (schema) => {
    required(schema.name, { message: 'El nombre es obligatorio.' });
    min(schema.minThreshold, 0, { message: 'El umbral no puede ser negativo.' });
  });
  readonly saving = signal(false);
  readonly serverError = signal<string | null>(null);

  submitItem(): void {
    this.serverError.set(null);
    submit(this.itemForm, () => this.save());
  }

  cancel(): void {
    if (!this.saving()) {
      this.cancelled.emit();
    }
  }

  private async save(): Promise<void> {
    const model = this.model();
    const threshold =
      typeof model.minThreshold === 'number' && Number.isFinite(model.minThreshold)
        ? Math.max(0, Math.floor(model.minThreshold))
        : 0;
    const body: CreateInventoryItemRequest = {
      name: model.name.trim(),
      ...(model.unit.trim() ? { unit: model.unit.trim() } : {}),
      minThreshold: threshold,
    };
    this.saving.set(true);
    try {
      await firstValueFrom(this.inventory.createItem(body));
      this.saved.emit();
    } catch (error) {
      this.serverError.set(errorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }
}
