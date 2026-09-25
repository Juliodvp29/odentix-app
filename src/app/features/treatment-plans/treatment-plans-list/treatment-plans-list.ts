import { httpResource } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiClient } from '@core/api/api-client';
import { Button } from '@shared/button/button';
import { Icon } from '@shared/icon/icon';
import { Select } from '@shared/select/select';
import { Skeleton } from '@shared/skeleton/skeleton';
import { formatDateEs } from '@shared/table/table-models';
import { STATUS_META, TreatmentPlanResponse, formatCop } from '../treatment-plan-models';
import { TreatmentPlanStatusPill } from '../treatment-plan-status-pill/treatment-plan-status-pill';

@Component({
  selector: 'app-treatment-plans-list',
  imports: [Button, Icon, RouterLink, Select, Skeleton, TreatmentPlanStatusPill],
  templateUrl: './treatment-plans-list.html',
  host: {
    class: 'block space-y-24',
  },
})
export class TreatmentPlansList {
  readonly patientId = input<string>('');
  readonly patientName = input<string>('');

  readonly newPlanClicked = output<void>();
  readonly planSelected = output<TreatmentPlanResponse>();

  private readonly api = inject(ApiClient);

  readonly statusFilter = signal<string>('');
  readonly statusOptions = Object.entries(STATUS_META).map(([key, meta]) => ({
    value: key,
    label: meta.label,
  }));

  readonly resource = httpResource<TreatmentPlanResponse[]>(() => {
    const pId = this.patientId();
    const status = this.statusFilter();
    const params: Record<string, string> = {};
    if (pId) {
      params['patientId'] = pId;
    }
    if (status) {
      params['status'] = status;
    }
    return {
      url: this.api.url('/api/v1/treatment-plans'),
      params,
    };
  });

  readonly plans = computed<TreatmentPlanResponse[]>(() => this.resource.value() ?? []);
  readonly loading = computed(() => this.resource.isLoading());
  readonly error = computed(() => this.resource.error() !== undefined);

  formatPrice(price: number | null | undefined): string {
    return formatCop(price);
  }

  formatDate(date: string | null | undefined): string {
    return date ? formatDateEs(date) : '—';
  }

  retry(): void {
    this.resource.reload();
  }
}
