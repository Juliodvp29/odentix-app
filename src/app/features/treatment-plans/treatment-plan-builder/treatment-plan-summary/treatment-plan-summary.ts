import { Component, computed, input } from '@angular/core';
import { PlanTotals, formatCop } from '../../treatment-plan-models';

@Component({
  selector: 'app-treatment-plan-summary',
  templateUrl: './treatment-plan-summary.html',
  host: {
    class: 'block',
  },
})
export class TreatmentPlanSummary {
  readonly totals = input.required<PlanTotals>();
  readonly itemsCount = input<number>(0);

  readonly formattedGross = computed(() => formatCop(this.totals().gross));
  readonly formattedDiscount = computed(() => formatCop(this.totals().discount));
  readonly formattedNet = computed(() => formatCop(this.totals().net));
}
