import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { TreatmentPlanResponse } from '../treatment-plan-models';
import { TreatmentPlanBuilder } from './treatment-plan-builder';

@Component({
  selector: 'app-treatment-plan-builder-page',
  imports: [TreatmentPlanBuilder],
  template: `
    <app-treatment-plan-builder
      [initialPatientId]="patientId()"
      (saved)="onSaved($event)"
      (cancelled)="onCancelled()"
    />
  `,
  host: {
    class: 'block py-4',
  },
})
export class TreatmentPlanBuilderPage {
  readonly patientId = input<string | null>(null);

  private readonly router = inject(Router);

  onSaved(plan: TreatmentPlanResponse): void {
    if (plan.id) {
      void this.router.navigate(['/treatment-plans', plan.id]);
    } else {
      void this.router.navigate(['/treatment-plans']);
    }
  }

  onCancelled(): void {
    void this.router.navigate(['/treatment-plans']);
  }
}
