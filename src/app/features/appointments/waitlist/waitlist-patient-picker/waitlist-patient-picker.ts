import { Component, computed, inject, output, signal } from '@angular/core';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, of } from 'rxjs';
import { PatientResponse, PatientsService } from '@features/patients/patients.service';
import { Button } from '@shared/button/button';
import { Icon } from '@shared/icon/icon';
import { Skeleton } from '@shared/skeleton/skeleton';

@Component({
  selector: 'app-waitlist-patient-picker',
  imports: [Button, Icon, Skeleton],
  templateUrl: './waitlist-patient-picker.html',
  host: { class: 'block' },
})
export class WaitlistPatientPicker {
  readonly selected = output<PatientResponse>();

  private readonly patients = inject(PatientsService);
  readonly search = signal('');
  private readonly debouncedSearch = toSignal(
    toObservable(this.search).pipe(debounceTime(250), distinctUntilChanged()),
    { initialValue: '' },
  );
  readonly results = rxResource({
    params: () => this.debouncedSearch().trim(),
    stream: ({ params }) => (params === '' ? of([]) : this.patients.searchPatients(params)),
  });

  readonly hasQuery = computed(() => this.search().trim().length > 0);
  readonly loading = computed(() => this.hasQuery() && this.results.isLoading());
  readonly error = computed(() =>
    this.hasQuery() && this.results.error() !== undefined
      ? 'No pudimos buscar pacientes. Intenta de nuevo.'
      : null,
  );
  readonly empty = computed(
    () =>
      this.hasQuery() &&
      !this.loading() &&
      !this.error() &&
      (this.results.value()?.length ?? 0) === 0,
  );

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  pick(patient: PatientResponse): void {
    this.selected.emit(patient);
  }

  retry(): void {
    if (this.hasQuery()) {
      this.results.reload();
    }
  }

  patientName(patient: PatientResponse): string {
    return `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim() || 'Sin nombre';
  }
}
