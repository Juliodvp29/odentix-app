import { Component, inject, input, linkedSignal, output, signal } from '@angular/core';
import { form, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { Button } from '@shared/button/button';
import { FormField } from '@shared/form-field/form-field';
import { TextInput } from '@shared/text-input/text-input';
import { CreateOdontogramEntryRequest, PatientsService } from '../../../patients.service';
import {
  CHART_NEUTRAL_FILL,
  CHART_NEUTRAL_STROKE,
  ENTRY_TYPE_LABELS,
  OdontogramEntryType,
  SURFACES,
  SurfaceId,
  surfaceLabel,
} from '../odontogram-model';

const ENTRY_TYPES: ReadonlyArray<OdontogramEntryType> = [
  'diagnostico',
  'plan_propuesto',
  'tratamiento_realizado',
  'estado_actual',
];

const CONDITION_PRESETS = ['Caries', 'Resina', 'Corona', 'Ausente', 'Endodoncia'];
const ABSENT_CONDITION = 'Pieza ausente';

// Modal form to register odontogram entries for one tooth. Surfaces map to
// one backend entry each; a whole tooth maps to a single surfaceless entry.
@Component({
  selector: 'app-odontogram-entry-form',
  imports: [Button, FormField, TextInput],
  templateUrl: './odontogram-entry-form.html',
  host: { class: 'block' },
})
export class OdontogramEntryForm {
  readonly patientId = input.required<string>();
  readonly toothNumber = input.required<number>();
  readonly preselectedSurface = input<SurfaceId | null>(null);

  readonly saved = output<void>();
  readonly cancelled = output<void>();

  private readonly patients = inject(PatientsService);

  readonly entryType = signal<OdontogramEntryType>('diagnostico');
  readonly surfaces = linkedSignal<Set<SurfaceId>>(() => {
    const preselected = this.preselectedSurface();
    return new Set<SurfaceId>(preselected ? [preselected] : ['oclusal']);
  });
  readonly wholeTooth = signal(false);

  readonly entryModel = signal({ condition: '', notes: '' });
  readonly entryForm = form(this.entryModel, (schema) => {
    required(schema.condition, { message: 'Describe la condición o procedimiento.' });
  });

  readonly saving = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly surfaceError = signal<string | null>(null);

  readonly entryTypes = ENTRY_TYPES;
  readonly entryLabels = ENTRY_TYPE_LABELS;
  readonly surfaceLabels: Record<SurfaceId, string> = {
    vestibular: surfaceLabel('vestibular'),
    distal: surfaceLabel('distal'),
    lingual: surfaceLabel('lingual'),
    mesial: surfaceLabel('mesial'),
    oclusal: surfaceLabel('oclusal'),
  };
  readonly surfaceOptions = SURFACES;
  readonly presets = CONDITION_PRESETS;
  readonly neutralFill = CHART_NEUTRAL_FILL;
  readonly neutralStroke = CHART_NEUTRAL_STROKE;
  readonly selectedFill = 'var(--color-teal)';

  onEntryTypeChange(event: Event): void {
    this.entryType.set((event.target as HTMLInputElement).value as OdontogramEntryType);
  }

  onSurfaceChange(surface: SurfaceId, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.surfaces.update((selected) => {
      const next = new Set(selected);
      if (checked) {
        next.add(surface);
      } else {
        next.delete(surface);
      }
      return next;
    });
    if (checked) {
      this.wholeTooth.set(false);
    }
  }

  onWholeToothChange(event: Event): void {
    this.wholeTooth.set((event.target as HTMLInputElement).checked);
  }

  applyPreset(preset: string): void {
    this.entryModel.update((model) => ({ ...model, condition: preset }));
  }

  submitEntry(): void {
    submit(this.entryForm, () => this.save());
  }

  private async save(): Promise<void> {
    const selected = [...this.surfaces()];
    if (!this.wholeTooth() && selected.length === 0) {
      this.surfaceError.set('Selecciona al menos una superficie.');
      return;
    }
    this.surfaceError.set(null);
    this.serverError.set(null);
    this.saving.set(true);
    try {
      const base: CreateOdontogramEntryRequest = {
        toothNumber: this.toothNumber(),
        entryType: this.entryType(),
        condition: this.entryModel().condition.trim(),
        notes: this.entryModel().notes.trim() || undefined,
      };
      const payloads = this.wholeTooth()
        ? [{ ...base, condition: base.condition || ABSENT_CONDITION }]
        : selected.map((surface) => ({ ...base, surface }));
      await Promise.all(
        payloads.map((payload) =>
          firstValueFrom(this.patients.addOdontogramEntry(this.patientId(), payload)),
        ),
      );
      this.saved.emit();
    } catch {
      this.serverError.set('No pudimos guardar la entrada. Intenta de nuevo.');
    } finally {
      this.saving.set(false);
    }
  }
}
