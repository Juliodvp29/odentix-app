import {
  Component,
  ElementRef,
  computed,
  inject,
  input,
  signal,
  viewChildren,
} from '@angular/core';
import { Button } from '@shared/button/button';
import { Link } from '@shared/link/link';
import { Skeleton } from '@shared/skeleton/skeleton';
import { PatientsService } from '@features/patients/patients.service';
import { formatDateEs, initialsOf } from '@shared/table/table-models';
import { ClinicalRecordsTimeline } from './clinical-records-timeline/clinical-records-timeline';
import { OdontogramView } from './odontogram-view/odontogram-view';
import { PatientFiles } from './patient-files/patient-files';

export type PatientTab = 'info' | 'records' | 'odontogram' | 'files';

const TABS: ReadonlyArray<{ id: PatientTab; label: string }> = [
  { id: 'info', label: 'Información' },
  { id: 'records', label: 'Historia clínica' },
  { id: 'odontogram', label: 'Odontograma' },
  { id: 'files', label: 'Archivos' },
];

@Component({
  selector: 'app-patient-detail',
  imports: [Button, ClinicalRecordsTimeline, Link, OdontogramView, PatientFiles, Skeleton],
  templateUrl: './patient-detail.html',
})
export class PatientDetailPage {
  readonly id = input('');

  private readonly patients = inject(PatientsService);

  readonly tabs = TABS;
  readonly activeTab = signal<PatientTab>('info');
  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  readonly detail = this.patients.detail(this.id);
  readonly patient = computed(() => this.detail.value() ?? null);
  readonly loading = computed(() => this.detail.isLoading());
  readonly loadError = computed(() => this.detail.error() !== undefined);
  readonly fullName = computed(() => {
    const patient = this.patient();
    return patient ? `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim() : '';
  });
  readonly initials = computed(() => initialsOf(this.fullName()));
  readonly documentLine = computed(() => {
    const patient = this.patient();
    return patient ? [patient.documentType, patient.documentNumber].filter(Boolean).join(' ') : '';
  });
  readonly birthDate = computed(() => {
    const raw = this.patient()?.birthDate;
    return raw ? formatDateEs(raw) : '';
  });
  readonly isActive = computed(() => (this.patient()?.active ?? true) !== false);

  selectTab(tab: PatientTab): void {
    this.activeTab.set(tab);
  }

  retry(): void {
    this.detail.reload();
  }

  onTabKeydown(event: KeyboardEvent): void {
    const ids = TABS.map((tab) => tab.id);
    const current = ids.indexOf(this.activeTab());
    let next: number | null = null;
    if (event.key === 'ArrowRight') {
      next = (current + 1) % ids.length;
    } else if (event.key === 'ArrowLeft') {
      next = (current - 1 + ids.length) % ids.length;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = ids.length - 1;
    }
    if (next !== null) {
      event.preventDefault();
      this.selectTab(ids[next]);
      this.tabButtons()[next]?.nativeElement.focus();
    }
  }
}
