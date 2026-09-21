import { HttpEventType, HttpResourceRef, httpResource } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Observable, filter, map } from 'rxjs';
import { ApiClient } from '@core/api/api-client';
import { components } from '@core/api/schema';
import { TableQuery, createInitialQuery } from '@shared/table/table-models';

export type PatientResponse = components['schemas']['PatientResponse'];
export type ClinicalRecordResponse = components['schemas']['ClinicalRecordResponse'];
export type OdontogramResponse = components['schemas']['OdontogramResponse'];
export type PatientFileResponse = components['schemas']['PatientFileResponse'];
export type PatientFileDownloadResponse = components['schemas']['PatientFileDownloadResponse'];

export type FileUploadEvent =
  | { readonly kind: 'progress'; readonly percent: number | null }
  | { readonly kind: 'complete'; readonly file: PatientFileResponse };
type PagePatientResponse = components['schemas']['PagePatientResponse'];
export type CreatePatientRequest = components['schemas']['CreatePatientRequest'];
export type UpdatePatientRequest = components['schemas']['UpdatePatientRequest'];

const SORT_FIELDS: Record<string, string> = {
  name: 'firstName',
  document: 'documentNumber',
  created: 'createdAt',
};

export function toPatientParams(query: TableQuery): Record<string, string> {
  const params: Record<string, string> = {
    page: String(query.page - 1),
    size: String(query.pageSize),
  };
  if (query.search) {
    params['query'] = query.search;
  }
  const sortField = query.sortKey ? SORT_FIELDS[query.sortKey] : undefined;
  if (sortField) {
    params['sort'] = `${sortField},${query.sortDir ?? 'asc'}`;
  }
  return params;
}

@Injectable({ providedIn: 'root' })
export class PatientsService {
  private readonly api = inject(ApiClient);

  readonly query = signal<TableQuery>(createInitialQuery(10));

  private readonly page = httpResource<PagePatientResponse>(() => ({
    url: this.api.url('/api/v1/patients'),
    params: toPatientParams(this.query()),
  }));

  readonly rows = computed(() => this.page.value()?.content ?? []);
  readonly total = computed(() => this.page.value()?.totalElements ?? 0);
  readonly loading = computed(() => this.page.isLoading());

  updateQuery(query: TableQuery): void {
    this.query.set(query);
  }

  detail(id: Signal<string>): HttpResourceRef<PatientResponse | undefined> {
    return httpResource<PatientResponse>(() => ({
      url: this.api.url(`/api/v1/patients/${id()}`),
    }));
  }

  clinicalRecords(id: Signal<string>): HttpResourceRef<ClinicalRecordResponse[] | undefined> {
    return httpResource<ClinicalRecordResponse[]>(() => ({
      url: this.api.url(`/api/v1/patients/${id()}/clinical-records`),
    }));
  }

  odontogram(id: Signal<string>): HttpResourceRef<OdontogramResponse | undefined> {
    return httpResource<OdontogramResponse>(() => ({
      url: this.api.url(`/api/v1/patients/${id()}/odontogram`),
    }));
  }

  files(id: Signal<string>): HttpResourceRef<PatientFileResponse[] | undefined> {
    return httpResource<PatientFileResponse[]>(() => ({
      url: this.api.url(`/api/v1/patients/${id()}/files`),
    }));
  }

  uploadFile(patientId: string, file: File): Observable<FileUploadEvent> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.api
      .upload<PatientFileResponse>(`/api/v1/patients/${patientId}/files`, formData)
      .pipe(
        map((event): FileUploadEvent | null => {
          if (event.type === HttpEventType.UploadProgress) {
            const percent =
              event.total && event.total > 0
                ? Math.round((event.loaded / event.total) * 100)
                : null;
            return { kind: 'progress', percent };
          }
          if (event.type === HttpEventType.Response) {
            return { kind: 'complete', file: event.body as PatientFileResponse };
          }
          return null;
        }),
        filter((event): event is FileUploadEvent => event !== null),
      );
  }

  fileDownloadUrl(patientId: string, fileId: string): Observable<PatientFileDownloadResponse> {
    return this.api.get<PatientFileDownloadResponse>(
      `/api/v1/patients/${patientId}/files/${fileId}/download-url`,
    );
  }

  create(patient: CreatePatientRequest): Observable<PatientResponse> {
    return this.api.post<CreatePatientRequest, PatientResponse>('/api/v1/patients', patient);
  }

  update(id: string, patient: UpdatePatientRequest): Observable<PatientResponse> {
    return this.api.patch<UpdatePatientRequest, PatientResponse>(`/api/v1/patients/${id}`, patient);
  }

  reload(): void {
    this.page.reload();
  }
}
