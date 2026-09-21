import { Component, TemplateRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { Button } from '@shared/button/button';
import { ModalHandle, ModalService } from '@shared/modal/modal.service';
import { Skeleton } from '@shared/skeleton/skeleton';
import { PatientsService } from '@features/patients/patients.service';
import { OdontogramChart, ToothSelection } from '../odontogram/odontogram-chart/odontogram-chart';
import { OdontogramEntryForm } from '../odontogram/odontogram-entry-form/odontogram-entry-form';
import { OdontogramPanel } from '../odontogram/odontogram-panel/odontogram-panel';
import { OdontogramEntry, TOOTH_NAMES, isKnownType } from '../odontogram/odontogram-model';

// Interactive odontogram: clinical chart, detail panel, and entry creation.
@Component({
  selector: 'app-odontogram-view',
  imports: [Button, OdontogramChart, OdontogramEntryForm, OdontogramPanel, Skeleton],
  templateUrl: './odontogram-view.html',
  host: { class: 'block' },
})
export class OdontogramView {
  readonly patientId = input.required<string>();

  private readonly patients = inject(PatientsService);
  private readonly modal = inject(ModalService);
  private readonly odontogram = this.patients.odontogram(this.patientId);
  private readonly entryTemplate = viewChild.required<TemplateRef<unknown>>('entryTemplate');
  private entryDialog: ModalHandle | null = null;

  readonly entriesByTooth = computed<ReadonlyMap<number, ReadonlyArray<OdontogramEntry>>>(() => {
    const lookup = new Map<number, OdontogramEntry[]>();
    for (const group of this.odontogram.value()?.teeth ?? []) {
      // The backend groups entries under their type key; an entry may not
      // repeat it, so the key acts as fallback for the entry type.
      const flat: OdontogramEntry[] = [];
      for (const [type, list] of Object.entries(group.entries ?? {})) {
        for (const entry of list ?? []) {
          const resolved = isKnownType(entry.entryType) ? entry.entryType : undefined;
          const fallback = isKnownType(type) ? type : undefined;
          flat.push({ ...entry, entryType: resolved ?? fallback });
        }
      }
      if (group.toothNumber !== undefined && flat.length > 0) {
        lookup.set(group.toothNumber, flat);
      }
    }
    return lookup;
  });
  readonly loading = computed(() => this.odontogram.isLoading());
  readonly loadError = computed(() => this.odontogram.error() !== undefined);

  readonly selection = signal<ToothSelection | null>(null);
  readonly selectedEntries = computed<ReadonlyArray<OdontogramEntry>>(() => {
    const selected = this.selection();
    return selected ? (this.entriesByTooth().get(selected.tooth) ?? []) : [];
  });

  readonly skeletonTeeth = Array.from({ length: 16 });

  onToothSelected(selection: ToothSelection): void {
    this.selection.set(selection);
  }

  onDeselected(): void {
    this.selection.set(null);
  }

  openEntryForm(): void {
    const selected = this.selection();
    if (!selected) {
      return;
    }
    const name = TOOTH_NAMES[selected.tooth] ?? 'Pieza dental';
    this.entryDialog = this.modal.open(this.entryTemplate(), {
      title: `Agregar entrada — Pieza ${selected.tooth} (${name})`,
    });
  }

  onEntrySaved(): void {
    this.entryDialog?.close();
    this.entryDialog = null;
    this.odontogram.reload();
  }

  onEntryCancelled(): void {
    this.entryDialog?.close();
    this.entryDialog = null;
  }

  retry(): void {
    this.odontogram.reload();
  }
}
