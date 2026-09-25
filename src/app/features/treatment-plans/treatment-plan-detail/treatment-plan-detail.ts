import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '@shared/button/button';
import { Icon } from '@shared/icon/icon';
import { Skeleton } from '@shared/skeleton/skeleton';
import { formatDateEs } from '@shared/table/table-models';
import {
  TreatmentPlanItemResponse,
  TreatmentPlanResponse,
  formatCop,
} from '../treatment-plan-models';
import { TreatmentPlanStatusPill } from '../treatment-plan-status-pill/treatment-plan-status-pill';
import { TreatmentPlansService } from '../treatment-plans.service';

@Component({
  selector: 'app-treatment-plan-detail',
  imports: [Button, Icon, RouterLink, Skeleton, TreatmentPlanStatusPill],
  templateUrl: './treatment-plan-detail.html',
  host: {
    class: 'block mx-auto max-w-5xl',
  },
})
export class TreatmentPlanDetail {
  readonly id = input.required<string>();

  private readonly plansService = inject(TreatmentPlansService);

  readonly detail = this.plansService.detail(this.id);
  readonly plan = computed<TreatmentPlanResponse | null>(() => this.detail.value() ?? null);
  readonly loading = computed(() => this.detail.isLoading());
  readonly error = computed(() => this.detail.error() !== undefined);

  readonly items = computed<TreatmentPlanItemResponse[]>(() => this.plan()?.items ?? []);

  formatPrice(val: number | null | undefined): string {
    return formatCop(val);
  }

  formatDate(date: string | null | undefined): string {
    return date ? formatDateEs(date) : '—';
  }

  retry(): void {
    this.detail.reload();
  }
}
