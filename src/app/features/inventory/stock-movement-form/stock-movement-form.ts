import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { form, min, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { Button } from '@shared/button/button';
import { FormField } from '@shared/form-field/form-field';
import { Select } from '@shared/select/select';
import { TextInput } from '@shared/text-input/text-input';
import { InventoryItemResponse } from '../inventory-models';
import { InventoryService } from '../inventory.service';

interface MovementFormModel {
  kind: string;
  quantity: number;
  reason: string;
}

const KIND_OPTIONS = [
  { value: 'in', label: 'Entrada' },
  { value: 'out', label: 'Salida' },
];

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
  return 'No pudimos registrar el movimiento. Intenta de nuevo.';
}

@Component({
  selector: 'app-stock-movement-form',
  imports: [Button, FormField, Select, TextInput],
  templateUrl: './stock-movement-form.html',
  host: { class: 'block' },
})
export class StockMovementForm {
  readonly item = input.required<InventoryItemResponse>();
  readonly moved = output<void>();
  readonly cancelled = output<void>();

  private readonly inventory = inject(InventoryService);

  readonly kindOptions = KIND_OPTIONS;

  readonly model = signal<MovementFormModel>({ kind: 'in', quantity: 1, reason: '' });
  readonly movementForm = form(this.model, (schema) => {
    required(schema.kind, { message: 'El tipo de movimiento es obligatorio.' });
    min(schema.quantity, 1, { message: 'La cantidad debe ser al menos 1.' });
  });
  readonly saving = signal(false);
  readonly movementError = signal<string | null>(null);
  readonly serverError = signal<string | null>(null);

  readonly effectiveQuantity = computed(() => {
    const raw = this.model().quantity;
    return typeof raw === 'number' && Number.isFinite(raw) ? Math.floor(raw) : 0;
  });
  readonly delta = computed(() =>
    this.model().kind === 'out' ? -this.effectiveQuantity() : this.effectiveQuantity(),
  );

  submitMovement(): void {
    this.movementError.set(null);
    this.serverError.set(null);
    submit(this.movementForm, () => this.save());
  }

  cancel(): void {
    if (!this.saving()) {
      this.cancelled.emit();
    }
  }

  private async save(): Promise<void> {
    const quantity = this.effectiveQuantity();
    if (quantity < 1) {
      this.movementError.set('La cantidad debe ser al menos 1.');
      return;
    }
    const stock = Number(this.item().quantity ?? 0);
    if (this.model().kind === 'out' && quantity > stock) {
      this.movementError.set(`La salida supera el stock disponible (${stock}).`);
      return;
    }

    const { id } = this.item();
    if (!id) {
      return;
    }
    const body = {
      quantityDelta: this.delta(),
      ...(this.model().reason.trim() ? { reason: this.model().reason.trim() } : {}),
    };
    this.saving.set(true);
    try {
      await firstValueFrom(this.inventory.registerMovement(id, body));
      this.moved.emit();
    } catch (error) {
      this.serverError.set(errorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }
}
