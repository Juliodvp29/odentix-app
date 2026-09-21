import { httpResource } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiClient } from '@core/api/api-client';
import { components } from '@core/api/schema';
import { TableQuery, createInitialQuery } from '@shared/table/table-models';

export type PatientResponse = components['schemas']['PatientResponse'];
type PagePatientResponse = components['schemas']['PagePatientResponse'];

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
}
