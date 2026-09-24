import { Component, computed, input, output } from '@angular/core';
import { Icon } from '@shared/icon/icon';
import { IconButton } from '@shared/icon-button/icon-button';
import { Select, SelectOption } from '@shared/select/select';
import {
  COMMON_PROCEDURES,
  TOOTH_OPTIONS,
  calculateItemNetPrice,
  formatCop,
} from '../../treatment-plan-models';

export interface TreatmentPlanItemDraft {
  readonly id: string;
  toothNumber: number | null;
  procedureId: string;
  procedureName: string;
  priceCop: number;
  discountCop: number;
}

@Component({
  selector: 'app-treatment-plan-item-row',
  imports: [Icon, IconButton, Select],
  templateUrl: './treatment-plan-item-row.html',
  host: {
    class: 'block border-b border-hairline py-4 last:border-b-0',
  },
})
export class TreatmentPlanItemRow {
  readonly item = input.required<TreatmentPlanItemDraft>();
  readonly index = input.required<number>();
  readonly canRemove = input(true);

  readonly itemChange = output<TreatmentPlanItemDraft>();
  readonly remove = output<void>();

  readonly toothSelectOptions: ReadonlyArray<SelectOption> = TOOTH_OPTIONS.map((opt) => ({
    value: opt.value === null ? '' : String(opt.value),
    label: opt.label,
  }));

  readonly procedureSelectOptions: ReadonlyArray<SelectOption> = COMMON_PROCEDURES.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  readonly selectedToothString = computed(() =>
    this.item().toothNumber === null ? '' : String(this.item().toothNumber),
  );

  readonly netPrice = computed(() =>
    calculateItemNetPrice(this.item().priceCop, this.item().discountCop),
  );

  readonly formattedNetPrice = computed(() => formatCop(this.netPrice()));

  readonly hasDiscountError = computed(
    () => (this.item().discountCop || 0) > (this.item().priceCop || 0),
  );

  onToothSelect(value: string): void {
    const toothNumber = value === '' ? null : Number(value);
    this.itemChange.emit({
      ...this.item(),
      toothNumber,
    });
  }

  onProcedureSelect(presetId: string): void {
    const preset = COMMON_PROCEDURES.find((p) => p.id === presetId);
    if (preset) {
      this.itemChange.emit({
        ...this.item(),
        procedureId: preset.id,
        procedureName: preset.name,
        priceCop: preset.defaultPriceCop > 0 ? preset.defaultPriceCop : this.item().priceCop,
      });
    }
  }

  onNameChange(event: Event): void {
    const name = (event.target as HTMLInputElement).value;
    this.itemChange.emit({
      ...this.item(),
      procedureName: name,
    });
  }

  onPriceChange(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value) || 0;
    this.itemChange.emit({
      ...this.item(),
      priceCop: Math.max(0, val),
    });
  }

  onDiscountChange(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value) || 0;
    this.itemChange.emit({
      ...this.item(),
      discountCop: Math.max(0, val),
    });
  }
}
