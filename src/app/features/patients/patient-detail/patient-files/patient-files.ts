import { Component, computed, inject, input, signal } from '@angular/core';
import { PatientFileResponse, PatientsService } from '@features/patients/patients.service';
import { Button } from '@shared/button/button';
import { Skeleton } from '@shared/skeleton/skeleton';
import { formatDateEs } from '@shared/table/table-models';

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

interface UploadingFile {
  readonly name: string;
  readonly percent: number | null;
}

// Library of a patient's files: upload with progress, list, and download.
@Component({
  selector: 'app-patient-files',
  imports: [Button, Skeleton],
  templateUrl: './patient-files.html',
  host: { class: 'block' },
})
export class PatientFiles {
  readonly patientId = input.required<string>();

  private readonly patients = inject(PatientsService);
  private readonly filesResource = this.patients.files(this.patientId);

  readonly files = computed(() => this.filesResource.value() ?? []);
  readonly loading = computed(() => this.filesResource.isLoading());
  readonly loadError = computed(() => this.filesResource.error() !== undefined);
  readonly isEmpty = computed(
    () => !this.loading() && !this.loadError() && this.files().length === 0,
  );

  readonly uploading = signal<UploadingFile | null>(null);
  readonly uploadError = signal<string | null>(null);
  readonly downloadingId = signal<string | null>(null);
  readonly downloadError = signal<string | null>(null);

  onFileSelected(event: Event): void {
    const picker = event.target as HTMLInputElement;
    const file = picker.files?.[0];
    picker.value = '';
    if (!file) {
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.uploadError.set('El archivo supera el límite de 15 MB.');
      return;
    }
    this.uploadError.set(null);
    this.uploading.set({ name: file.name, percent: 0 });
    this.patients.uploadFile(this.patientId(), file).subscribe({
      next: (uploadEvent) => {
        if (uploadEvent.kind === 'progress') {
          const percent = uploadEvent.percent;
          this.uploading.update((current) => (current ? { ...current, percent } : current));
        } else {
          this.uploading.set(null);
          this.filesResource.reload();
        }
      },
      error: () => {
        this.uploading.set(null);
        this.uploadError.set('No pudimos subir el archivo. Intenta de nuevo.');
      },
    });
  }

  download(file: PatientFileResponse): void {
    if (!file.id || this.downloadingId() !== null) {
      return;
    }
    this.downloadError.set(null);
    this.downloadingId.set(file.id);
    this.patients.fileDownloadUrl(this.patientId(), file.id).subscribe({
      next: (response) => {
        this.downloadingId.set(null);
        if (response.downloadUrl) {
          window.open(response.downloadUrl, '_blank', 'noopener');
        } else {
          this.downloadError.set('No pudimos preparar la descarga. Intenta de nuevo.');
        }
      },
      error: () => {
        this.downloadingId.set(null);
        this.downloadError.set('No pudimos preparar la descarga. Intenta de nuevo.');
      },
    });
  }

  formatSize(bytes: number | undefined): string {
    if (bytes === undefined || bytes === null) {
      return '—';
    }
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  formatDate(value: string | undefined): string {
    return value ? formatDateEs(value) : '';
  }

  retry(): void {
    this.filesResource.reload();
  }
}
