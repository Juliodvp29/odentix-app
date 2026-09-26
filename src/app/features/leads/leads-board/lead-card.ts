import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatCop } from '@features/treatment-plans/treatment-plan-models';
import { formatDateEs } from '@shared/table/table-models';
import { LeadResponse, LeadStatus, assigneeInitials } from '../lead-models';
import { LeadStageSelect } from '../lead-stage-select/lead-stage-select';

@Component({
  selector: 'app-lead-card',
  imports: [LeadStageSelect, RouterLink],
  templateUrl: './lead-card.html',
  host: { class: 'block' },
})
export class LeadCard {
  readonly lead = input.required<LeadResponse>();
  readonly moved = output<{ id: string; status: LeadStatus }>();

  readonly initials = computed(() => assigneeInitials(this.lead().assignedToName));

  formatValue(val: number | null | undefined): string {
    return formatCop(val);
  }

  formatDate(date: string | null | undefined): string {
    return date ? formatDateEs(date) : '—';
  }
}
