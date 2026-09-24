import { Component, computed, input } from '@angular/core';
import { STATUS_META, TreatmentPlanStatus } from '../treatment-plan-models';

@Component({
  selector: 'app-treatment-plan-status-pill',
  templateUrl: './treatment-plan-status-pill.html',
  host: {
    class: 'inline-flex items-center',
  },
})
export class TreatmentPlanStatusPill {
  readonly status = input.required<TreatmentPlanStatus | string | null | undefined>();

  readonly meta = computed(() => {
    const raw = this.status();
    if (raw && raw in STATUS_META) {
      return STATUS_META[raw as TreatmentPlanStatus];
    }
    return STATUS_META.borrador;
  });
}
