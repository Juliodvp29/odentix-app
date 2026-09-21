import { httpResource } from '@angular/common/http';
import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Button } from '@shared/button/button';
import { Skeleton } from '@shared/skeleton/skeleton';
import { ApiClient } from '@core/api/api-client';
import { components } from '@core/api/schema';

type DownloadResponse = components['schemas']['PatientFileDownloadResponse'];

export function isPreviewable(contentType: string | undefined | null): boolean {
  return contentType?.startsWith('image/') === true || contentType === 'application/pdf';
}

// In-modal preview of an image or PDF through its signed download url.
@Component({
  selector: 'app-file-preview',
  imports: [Button, Skeleton],
  templateUrl: './file-preview.html',
  host: { class: 'block' },
})
export class FilePreview {
  readonly patientId = input.required<string>();
  readonly fileId = input.required<string>();
  readonly fileName = input.required<string>();
  readonly contentType = input<string | undefined>(undefined);

  private readonly api = inject(ApiClient);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly download = httpResource<DownloadResponse>(() => ({
    url: this.api.url(`/api/v1/patients/${this.patientId()}/files/${this.fileId()}/download-url`),
  }));

  readonly url = computed(() => this.download.value()?.downloadUrl ?? null);
  // The signed url comes from the backend, never from user input, so marking
  // it trusted for the embed resource context is safe here.
  readonly safeUrl = computed(() => {
    const url = this.url();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });
  readonly loading = computed(() => this.download.isLoading());
  readonly loadError = computed(() => this.download.error() !== undefined);
  readonly isImage = computed(() => this.contentType()?.startsWith('image/') ?? false);
  readonly isPdf = computed(() => this.contentType() === 'application/pdf');

  retry(): void {
    this.download.reload();
  }
}
