import { Component, computed, output, signal } from '@angular/core';
import { PatientResponse } from '@features/patients/patients.service';
import { Button } from '@shared/button/button';
import {
  WaitlistEntryForm,
  WaitlistEntryFormData,
} from '../waitlist-entry-form/waitlist-entry-form';
import { WaitlistPatientPicker } from '../waitlist-patient-picker/waitlist-patient-picker';

@Component({
  selector: 'app-waitlist-create-dialog',
  imports: [Button, WaitlistEntryForm, WaitlistPatientPicker],
  templateUrl: './waitlist-create-dialog.html',
  host: { class: 'block' },
})
export class WaitlistCreateDialog {
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  readonly patient = signal<PatientResponse | null>(null);
  readonly formData = computed<WaitlistEntryFormData>(() => ({
    patientId: this.patient()?.id ?? '',
    patientName: this.patientName(this.patient()),
  }));

  selectPatient(patient: PatientResponse): void {
    this.patient.set(patient);
  }

  changePatient(): void {
    this.patient.set(null);
  }

  patientName(patient: PatientResponse | null): string {
    if (!patient) {
      return '';
    }
    return `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim() || 'Sin nombre';
  }
}
