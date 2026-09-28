import { Component, computed, inject, signal } from '@angular/core';
import { Button } from '@shared/button/button';
import { Icon } from '@shared/icon/icon';
import { Skeleton } from '@shared/skeleton/skeleton';
import {
  OpportunityResponse,
  OpportunitySegment,
  PriorityTier,
  groupOpportunities,
  isActiveOpportunity,
  opportunityTitle,
  priorityTier,
  totalValue,
  valueLabel,
} from '../opportunity-models';
import { OpportunitiesService, isPlanGateError } from '../opportunities.service';

const SEGMENTS: ReadonlyArray<{ value: OpportunitySegment; label: string }> = [
  { value: 'activas', label: 'Activas' },
  { value: 'resuelta', label: 'Resueltas' },
  { value: 'descartada', label: 'Descartadas' },
];

const TIER_CARD_CLASS: Record<PriorityTier, string> = {
  high: 'border-teal',
  medium: 'border-hairline',
  low: 'border-hairline',
};

const TIER_LABEL: Record<PriorityTier, string> = {
  high: 'Prioridad alta',
  medium: 'Prioridad media',
  low: 'Prioridad baja',
};

const TIER_TEXT_CLASS: Record<PriorityTier, string> = {
  high: 'text-teal-deep',
  medium: 'text-mid-gray',
  low: 'text-mid-gray',
};

@Component({
  selector: 'app-opportunities-board',
  imports: [Button, Icon, Skeleton],
  templateUrl: './opportunities-board.html',
  host: { class: 'block space-y-24' },
})
export class OpportunitiesBoard {
  private readonly opportunities = inject(OpportunitiesService);
  private readonly resource = this.opportunities.open();

  readonly segment = signal<OpportunitySegment>('activas');
  readonly segments = SEGMENTS;

  readonly loading = computed(() => this.resource.isLoading());
  readonly planGated = computed(() => isPlanGateError(this.resource.error()));
  readonly loadError = computed(() => !this.planGated() && this.resource.error() !== undefined);

  private readonly all = computed<OpportunityResponse[]>(() => this.resource.value() ?? []);

  private readonly visible = computed<OpportunityResponse[]>(() => {
    const segment = this.segment();
    if (segment === 'activas') {
      return this.all().filter(isActiveOpportunity);
    }
    return this.all().filter((opportunity) => opportunity.status === segment);
  });

  readonly groups = computed(() => groupOpportunities(this.visible()));
  readonly activeCount = computed(() => this.all().filter(isActiveOpportunity).length);
  readonly totalLabel = computed(() =>
    valueLabel(totalValue(this.all().filter(isActiveOpportunity))),
  );

  title(opportunity: OpportunityResponse): string {
    return opportunityTitle(opportunity);
  }

  amount(opportunity: OpportunityResponse): string {
    return valueLabel(opportunity.estimatedValueCop);
  }

  tier(opportunity: OpportunityResponse): PriorityTier {
    return priorityTier(opportunity.priority);
  }

  tierCardClass(opportunity: OpportunityResponse): string {
    return TIER_CARD_CLASS[this.tier(opportunity)];
  }

  tierLabel(opportunity: OpportunityResponse): string {
    return TIER_LABEL[this.tier(opportunity)];
  }

  tierTextClass(opportunity: OpportunityResponse): string {
    return TIER_TEXT_CLASS[this.tier(opportunity)];
  }

  detectedLabel(opportunity: OpportunityResponse): string {
    return opportunity.detectedAt ? opportunity.detectedAt.slice(0, 10) : '—';
  }

  suggestedActionLabel(opportunity: OpportunityResponse): string {
    const type = opportunity.actions?.[0]?.actionType;
    if (type === 'crear_tarea') {
      return 'Crear tarea';
    }
    if (type === 'enviar_mensaje') {
      return 'Enviar mensaje';
    }
    return 'Sin acción sugerida';
  }

  showSegment(segment: OpportunitySegment): void {
    this.segment.set(segment);
  }

  retry(): void {
    this.resource.reload();
  }
}
