import { Component, computed, inject, input } from '@angular/core';
import { PatientsService } from '@features/patients/patients.service';
import { Button } from '@shared/button/button';
import { Skeleton } from '@shared/skeleton/skeleton';
import { formatDateEs } from '@shared/table/table-models';

// Timeline of a patient's clinical history, newest first.
@Component({
  selector: 'app-clinical-records-timeline',
  imports: [Button, Skeleton],
  templateUrl: './clinical-records-timeline.html',
  host: { class: 'block' },
})
export class ClinicalRecordsTimeline {
  readonly patientId = input.required<string>();

  private readonly patients = inject(PatientsService);
  private readonly records = this.patients.clinicalRecords(this.patientId);

  readonly entries = computed(() => this.records.value() ?? []);
  readonly loading = computed(() => this.records.isLoading());
  readonly loadError = computed(() => this.records.error() !== undefined);
  readonly isEmpty = computed(
    () => !this.loading() && !this.loadError() && this.entries().length === 0,
  );

  formatDate(value: string | undefined): string {
    return value ? formatDateEs(value) : '';
  }

  retry(): void {
    this.records.reload();
  }
}
