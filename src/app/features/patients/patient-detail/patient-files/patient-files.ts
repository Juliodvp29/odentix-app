import { Component, TemplateRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { form } from '@angular/forms/signals';
import { PatientFileResponse, PatientsService } from '@features/patients/patients.service';
import { Button } from '@shared/button/button';
import { FormField } from '@shared/form-field/form-field';
import { ModalService } from '@shared/modal/modal.service';
import { Skeleton } from '@shared/skeleton/skeleton';
import { TextInput } from '@shared/text-input/text-input';
import { formatDateEs } from '@shared/table/table-models';
import { FilePreview, isPreviewable } from '../file-preview/file-preview';

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

interface StagedFile {
  readonly file: File;
  readonly extension: string;
}

interface UploadingFile {
  readonly name: string;
  readonly percent: number | null;
}

function splitFileName(fileName: string): { base: string; extension: string } {
  const dot = fileName.lastIndexOf('.');
  if (dot <= 0) {
    return { base: fileName, extension: '' };
  }
  return { base: fileName.slice(0, dot), extension: fileName.slice(dot) };
}

// Library of a patient's files: staged upload with rename, list,
// download, and in-app preview.
@Component({
  selector: 'app-patient-files',
  imports: [Button, FilePreview, FormField, Skeleton, TextInput],
  templateUrl: './patient-files.html',
  host: { class: 'block' },
})
export class PatientFiles {
  readonly patientId = input.required<string>();

  private readonly patients = inject(PatientsService);
  private readonly modal = inject(ModalService);
  private readonly filesResource = this.patients.files(this.patientId);
  private readonly previewTemplate = viewChild.required<TemplateRef<unknown>>('previewTemplate');

  readonly files = computed(() => this.filesResource.value() ?? []);
  readonly loading = computed(() => this.filesResource.isLoading());
  readonly loadError = computed(() => this.filesResource.error() !== undefined);
  readonly isEmpty = computed(
    () => !this.loading() && !this.loadError() && this.files().length === 0,
  );

  readonly renameModel = signal({ name: '' });
  readonly renameForm = form(this.renameModel);

  readonly staged = signal<StagedFile | null>(null);
  readonly uploading = signal<UploadingFile | null>(null);
  readonly uploadError = signal<string | null>(null);
  readonly downloadingId = signal<string | null>(null);
  readonly downloadError = signal<string | null>(null);
  readonly previewFile = signal<PatientFileResponse | null>(null);

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
    const { base, extension } = splitFileName(file.name);
    this.uploadError.set(null);
    this.renameModel.set({ name: base });
    this.staged.set({ file, extension });
  }

  cancelStaged(): void {
    this.staged.set(null);
  }

  confirmUpload(): void {
    const staged = this.staged();
    if (!staged || this.uploading()) {
      return;
    }
    const base = this.renameModel().name.trim() || splitFileName(staged.file.name).base;
    const filename = `${base}${staged.extension}`;
    this.staged.set(null);
    this.uploadError.set(null);
    this.uploading.set({ name: filename, percent: 0 });
    this.patients.uploadFile(this.patientId(), staged.file, filename).subscribe({
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

  canPreview(file: PatientFileResponse): boolean {
    return isPreviewable(file.contentType);
  }

  openPreview(file: PatientFileResponse): void {
    if (!file.id) {
      return;
    }
    this.previewFile.set(file);
    this.modal.open(this.previewTemplate(), { title: file.fileName ?? 'Vista previa' });
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
