import { Component, computed, inject, input } from '@angular/core';
import { components } from '@core/api/schema';
import { PatientsService } from '@features/patients/patients.service';
import { Button } from '@shared/button/button';
import { Skeleton } from '@shared/skeleton/skeleton';
import { formatDateEs } from '@shared/table/table-models';

type OdontogramEntry = components['schemas']['OdontogramEntryResponse'];
type EntryType = 'estado_actual' | 'diagnostico' | 'plan_propuesto' | 'tratamiento_realizado';

interface EntryGroup {
  type: EntryType;
  label: string;
  badge: string;
  entries: OdontogramEntry[];
}

interface ToothView {
  toothNumber: number;
  groups: EntryGroup[];
}

const ENTRY_TYPE_ORDER: EntryType[] = [
  'estado_actual',
  'diagnostico',
  'plan_propuesto',
  'tratamiento_realizado',
];

const ENTRY_TYPE_META: Record<EntryType, { label: string; badge: string }> = {
  estado_actual: { label: 'Estado actual', badge: 'bg-info-soft text-info-deep' },
  diagnostico: { label: 'Diagnóstico', badge: 'bg-warning-soft text-warning-deep' },
  plan_propuesto: { label: 'Plan propuesto', badge: 'bg-teal-soft text-teal-deep' },
  tratamiento_realizado: {
    label: 'Tratamiento realizado',
    badge: 'bg-success-soft text-success-deep',
  },
};

// Odontogram data grouped by tooth, with entries separated by type.
@Component({
  selector: 'app-odontogram-view',
  imports: [Button, Skeleton],
  templateUrl: './odontogram-view.html',
  host: { class: 'block' },
})
export class OdontogramView {
  readonly patientId = input.required<string>();

  private readonly patients = inject(PatientsService);
  private readonly odontogram = this.patients.odontogram(this.patientId);

  readonly teeth = computed<ToothView[]>(() => {
    const groups = this.odontogram.value()?.teeth ?? [];
    return groups
      .map((group) => ({
        toothNumber: group.toothNumber ?? 0,
        groups: ENTRY_TYPE_ORDER.map((type) => ({
          type,
          label: ENTRY_TYPE_META[type].label,
          badge: ENTRY_TYPE_META[type].badge,
          entries: group.entries?.[type] ?? [],
        })).filter((grouped) => grouped.entries.length > 0),
      }))
      .filter((tooth) => tooth.groups.length > 0)
      .sort((left, right) => left.toothNumber - right.toothNumber);
  });
  readonly loading = computed(() => this.odontogram.isLoading());
  readonly loadError = computed(() => this.odontogram.error() !== undefined);
  readonly isEmpty = computed(
    () => !this.loading() && !this.loadError() && this.teeth().length === 0,
  );

  formatDate(value: string | undefined): string {
    return value ? formatDateEs(value) : '';
  }

  retry(): void {
    this.odontogram.reload();
  }
}
