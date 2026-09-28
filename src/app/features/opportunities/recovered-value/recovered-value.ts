import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { form, required } from '@angular/forms/signals';
import { Button } from '@shared/button/button';
import { FormField } from '@shared/form-field/form-field';
import { Icon } from '@shared/icon/icon';
import { Skeleton } from '@shared/skeleton/skeleton';
import { TextInput } from '@shared/text-input/text-input';
import {
  defaultMetricsRange,
  rangeBounds,
  recoveredTotals,
  recoveryCategoryRows,
  valueLabel,
} from '../opportunity-models';
import { OpportunitiesService, isPlanGateError } from '../opportunities.service';

interface RangeFormModel {
  from: string;
  to: string;
}

// Recovered value per category in a range, straight from the backend
// attribution endpoint (resolved + previously executed action).
@Component({
  selector: 'app-recovered-value',
  imports: [Button, FormField, Icon, RouterLink, Skeleton, TextInput],
  templateUrl: './recovered-value.html',
  host: { class: 'block space-y-24' },
})
export class RecoveredValue {
  private readonly opportunities = inject(OpportunitiesService);

  readonly model = signal<RangeFormModel>(defaultMetricsRange());
  readonly rangeForm = form(this.model, (schema) => {
    required(schema.from, { message: 'La fecha inicial es obligatoria.' });
    required(schema.to, { message: 'La fecha final es obligatoria.' });
  });

  readonly rangeValid = computed(() => {
    const range = this.model();
    return Boolean(range.from) && Boolean(range.to) && range.from <= range.to;
  });
  // Empty bounds skip the request instead of firing a doomed one.
  readonly fromInstant = computed(() => (this.rangeValid() ? rangeBounds(this.model()).from : ''));
  readonly toInstant = computed(() => (this.rangeValid() ? rangeBounds(this.model()).to : ''));

  readonly recovered = this.opportunities.recoveredValue(this.fromInstant, this.toInstant);

  readonly loading = computed(() => this.recovered.isLoading());
  readonly planGated = computed(() => isPlanGateError(this.recovered.error()));
  readonly loadFailed = computed(() => !this.planGated() && this.recovered.error() !== undefined);

  readonly totalLabel = computed(() =>
    valueLabel(recoveredTotals(this.recovered.value() ?? []).total),
  );
  readonly countLabel = computed(() => String(recoveredTotals(this.recovered.value() ?? []).count));
  readonly rows = computed(() => recoveryCategoryRows(this.recovered.value() ?? []));

  retry(): void {
    this.recovered.reload();
  }
}
