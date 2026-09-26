import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { form, required } from '@angular/forms/signals';
import { Button } from '@shared/button/button';
import { FormField } from '@shared/form-field/form-field';
import { Icon } from '@shared/icon/icon';
import { Skeleton } from '@shared/skeleton/skeleton';
import { TextInput } from '@shared/text-input/text-input';
import {
  ConversionMetricItem,
  defaultMetricsRange,
  formatPercent,
  formatResponseTime,
  rangeBounds,
  rateBarWidth,
} from '../lead-models';
import { LeadsService, isPlanGateError } from '../leads.service';

interface RangeFormModel {
  from: string;
  to: string;
}

interface StatCard {
  readonly label: string;
  readonly value: string;
}

interface BarRow {
  readonly label: string;
  readonly detail: string;
  readonly rate: string;
  readonly width: string;
}

function toRows(items: ReadonlyArray<ConversionMetricItem> | null | undefined): BarRow[] {
  return (items ?? []).map((item) => ({
    label: item.dimensionValue || 'Sin dato',
    detail: `${item.convertedLeads ?? 0} de ${item.totalLeads ?? 0}`,
    rate: formatPercent(item.conversionRatePercentage),
    width: rateBarWidth(item.conversionRatePercentage),
  }));
}

@Component({
  selector: 'app-lead-metrics',
  imports: [Button, FormField, Icon, RouterLink, Skeleton, TextInput],
  templateUrl: './lead-metrics.html',
  host: { class: 'block space-y-24' },
})
export class LeadMetrics {
  private readonly leads = inject(LeadsService);

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

  readonly conversion = this.leads.conversionMetrics(this.fromInstant, this.toInstant);
  readonly responseTime = this.leads.responseTimeMetrics(this.fromInstant, this.toInstant);

  readonly loading = computed(() => this.conversion.isLoading() || this.responseTime.isLoading());
  readonly planGated = computed(
    () => isPlanGateError(this.conversion.error()) || isPlanGateError(this.responseTime.error()),
  );
  readonly loadFailed = computed(
    () =>
      !this.planGated() &&
      (this.conversion.error() !== undefined || this.responseTime.error() !== undefined),
  );

  readonly statCards = computed<StatCard[]>(() => {
    const conversion = this.conversion.value();
    const response = this.responseTime.value();
    return [
      { label: 'Prospectos', value: String(conversion?.totalLeads ?? 0) },
      { label: 'Convertidos', value: String(conversion?.convertedLeads ?? 0) },
      { label: 'Tasa de conversión', value: formatPercent(conversion?.conversionRatePercentage) },
      { label: 'Tasa de respuesta', value: formatPercent(response?.responseRatePercentage) },
      {
        label: 'Tiempo medio de respuesta',
        value: formatResponseTime(response?.averageResponseTimeMinutes),
      },
    ];
  });

  readonly sourceRows = computed(() => toRows(this.conversion.value()?.bySource));
  readonly campaignRows = computed(() => toRows(this.conversion.value()?.byCampaign));

  retry(): void {
    this.conversion.reload();
    this.responseTime.reload();
  }
}
