import { Component, computed, inject, input, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { debounceTime, of } from 'rxjs';
import { Button } from '@shared/button/button';
import { Icon } from '@shared/icon/icon';
import { Select, SelectOption } from '@shared/select/select';
import { ToastService } from '@shared/toast/toast.service';
import { PatientResponse, PatientsService } from '@features/patients/patients.service';
import { AppointmentsService } from '@features/appointments/appointments.service';
import {
  CreateTreatmentPlanItemRequest,
  CreateTreatmentPlanRequest,
  TreatmentPlanResponse,
  calculatePlanTotals,
} from '../treatment-plan-models';
import { TreatmentPlansService } from '../treatment-plans.service';
import {
  TreatmentPlanItemDraft,
  TreatmentPlanItemRow,
} from './treatment-plan-item-row/treatment-plan-item-row';
import { TreatmentPlanSummary } from './treatment-plan-summary/treatment-plan-summary';

let draftItemId = 0;
function createDraftItem(toothNumber: number | null = null): TreatmentPlanItemDraft {
  draftItemId += 1;
  return {
    id: `item-${draftItemId}`,
    toothNumber,
    procedureId: 'proc-profilaxis',
    procedureName: 'Profilaxis y limpieza profunda',
    priceCop: 90000,
    discountCop: 0,
  };
}

@Component({
  selector: 'app-treatment-plan-builder',
  imports: [Button, Icon, Select, TreatmentPlanItemRow, TreatmentPlanSummary],
  templateUrl: './treatment-plan-builder.html',
  host: {
    class: 'block max-w-5xl mx-auto space-y-6',
  },
})
export class TreatmentPlanBuilder {
  readonly initialPatientId = input<string | null>(null);
  readonly initialPatientName = input<string | null>(null);
  readonly editPlanId = input<string | null>(null);

  readonly saved = output<TreatmentPlanResponse>();
  readonly cancelled = output<void>();

  private readonly plansService = inject(TreatmentPlansService);
  private readonly patientsService = inject(PatientsService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly toasts = inject(ToastService);

  readonly professionalSelectOptions = computed<ReadonlyArray<SelectOption>>(() =>
    this.appointmentsService.professionalOptions().map((p) => ({ value: p.id, label: p.name })),
  );

  readonly patientSearch = signal('');
  readonly selectedPatient = signal<{ id: string; name: string } | null>(null);

  readonly patientResults = rxResource({
    params: () => this.patientSearch(),
    stream: ({ params: query }) =>
      query.trim().length < 2
        ? of([])
        : this.patientsService.searchPatients(query.trim()).pipe(debounceTime(250)),
  });

  readonly professionalId = signal<string>('');
  readonly professionalOptions = computed(() => this.appointmentsService.professionalOptions());

  readonly diagnosis = signal<string>('');
  readonly items = signal<TreatmentPlanItemDraft[]>([createDraftItem()]);

  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly totals = computed(() => calculatePlanTotals(this.items()));

  readonly hasDiscountError = computed(() =>
    this.items().some((item) => (item.discountCop || 0) > (item.priceCop || 0)),
  );

  readonly isValid = computed(() => {
    const hasPatient = Boolean(this.activePatientId());
    const hasItems = this.items().length > 0;
    const allPricesValid = this.items().every((i) => (i.priceCop || 0) > 0);
    return hasPatient && hasItems && allPricesValid && !this.hasDiscountError();
  });

  readonly activePatientId = computed(() => {
    if (this.selectedPatient()) return this.selectedPatient()!.id;
    return this.initialPatientId() || '';
  });

  readonly activePatientName = computed(() => {
    if (this.selectedPatient()) return this.selectedPatient()!.name;
    return this.initialPatientName() || '';
  });

  addItem(): void {
    this.items.update((list) => [...list, createDraftItem()]);
  }

  updateItem(index: number, updated: TreatmentPlanItemDraft): void {
    this.items.update((list) => list.map((item, i) => (i === index ? updated : item)));
  }

  removeItem(index: number): void {
    this.items.update((list) => list.filter((_, i) => i !== index));
  }

  pickPatient(patient: PatientResponse): void {
    const name = `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim() || 'Sin nombre';
    this.selectedPatient.set({ id: patient.id ?? '', name });
    this.patientSearch.set('');
  }

  clearPatient(): void {
    this.selectedPatient.set(null);
  }

  submitPlan(): void {
    if (!this.isValid() || this.saving()) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    const requestItems: CreateTreatmentPlanItemRequest[] = this.items().map((item) => ({
      toothNumber: item.toothNumber ?? undefined,
      priceCop: item.priceCop,
      discountCop: item.discountCop > 0 ? item.discountCop : 0,
    }));

    const request: CreateTreatmentPlanRequest = {
      patientId: this.activePatientId(),
      professionalId: this.professionalId() || undefined,
      diagnosis: this.diagnosis().trim() || undefined,
      items: requestItems,
    };

    this.plansService.createTreatmentPlan(request).subscribe({
      next: (created) => {
        this.saving.set(false);
        this.toasts.show('Plan de tratamiento creado correctamente en estado borrador.');
        this.saved.emit(created);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message || 'No fue posible guardar el plan de tratamiento.';
        this.errorMessage.set(msg);
      },
    });
  }
}
