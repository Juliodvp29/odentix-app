import { Component, computed, input, output } from '@angular/core';
import { Button } from '@shared/button/button';
import { formatDateEs } from '@shared/table/table-models';
import {
  CHART_NEUTRAL_FILL,
  CHART_NEUTRAL_STROKE,
  ENTRY_TYPE_BADGES,
  ENTRY_TYPE_LABELS,
  OdontogramEntry,
  OdontogramEntryType,
  SURFACES,
  SurfaceId,
  TOOTH_NAMES,
  ToothState,
  surfaceColor,
  surfaceLabel,
  toothState,
  toothStatus,
} from '../odontogram-model';

// Detail panel for the selected tooth: status, mini surface map, entries.
@Component({
  selector: 'app-odontogram-panel',
  imports: [Button],
  templateUrl: './odontogram-panel.html',
  host: { class: 'block' },
})
export class OdontogramPanel {
  readonly toothNumber = input.required<number>();
  readonly entries = input.required<ReadonlyArray<OdontogramEntry>>();

  readonly addEntry = output<void>();

  readonly state = computed<ToothState>(() => toothState(this.entries()));
  readonly status = computed(() => toothStatus(this.state()));
  readonly toothName = computed(() => TOOTH_NAMES[this.toothNumber()] ?? 'Pieza dental');
  readonly entryCount = computed(() => {
    const total = this.entries().length;
    return total === 1 ? '1 entrada' : `${total} entradas`;
  });
  readonly affectedSurfaces = computed(() => {
    const surfaces = SURFACES.filter((surface) => this.state().surfaceTypes[surface]);
    if (this.state().isMissing) {
      return 'Pieza completa (Ausente)';
    }
    return surfaces.length > 0
      ? surfaces.map((surface) => surfaceLabel(surface)).join(', ')
      : 'Ninguna';
  });

  readonly neutralFill = CHART_NEUTRAL_FILL;
  readonly neutralStroke = CHART_NEUTRAL_STROKE;

  fillFor(surface: SurfaceId): string {
    return surfaceColor(this.state(), surface);
  }

  entryLabel(type: OdontogramEntryType | undefined): string {
    return type ? ENTRY_TYPE_LABELS[type] : 'Registro';
  }

  entryBadge(type: OdontogramEntryType | undefined): string {
    return type ? ENTRY_TYPE_BADGES[type] : 'bg-surface-alt text-mid-gray';
  }

  formatDate(value: string | undefined): string {
    return value ? formatDateEs(value) : '';
  }

  formatSurface(value: string | undefined): string {
    return surfaceLabel(value);
  }
}
