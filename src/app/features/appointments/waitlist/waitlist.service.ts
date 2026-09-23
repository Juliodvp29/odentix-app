import { HttpParams, httpResource } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiClient } from '@core/api/api-client';
import { components } from '@core/api/schema';
import { TableQuery, createInitialQuery } from '@shared/table/table-models';

export type WaitlistEntryResponse = components['schemas']['WaitlistEntryResponse'];
export type WaitlistStatus = NonNullable<WaitlistEntryResponse['status']>;
export type CreateWaitlistEntryRequest = components['schemas']['CreateWaitlistEntryRequest'];
type WaitlistPageResponse = components['schemas']['Page'];

export type UpdateWaitlistStatusRequest = components['schemas']['UpdateWaitlistStatusRequest'];
export type ConvertWaitlistEntryRequest = components['schemas']['ConvertWaitlistEntryRequest'];

const SORT_FIELDS: Record<string, string> = {
  created: 'createdAt',
  createdAt: 'createdAt',
};

export function toWaitlistParams(query: TableQuery): Record<string, string> {
  const params: Record<string, string> = {
    page: String(Math.max(0, query.page - 1)),
    size: String(query.pageSize),
  };
  if (query.search?.trim()) {
    params['query'] = query.search.trim();
  }
  const status = query.filters['status'];
  if (typeof status === 'string' && status) {
    params['status'] = status;
  }
  const sortField = query.sortKey ? SORT_FIELDS[query.sortKey] : undefined;
  if (sortField) {
    params['sort'] = `${sortField},${query.sortDir ?? 'asc'}`;
  }
  return params;
}

function toHttpParams(params: Record<string, string>): HttpParams {
  return new HttpParams({ fromObject: params });
}

@Injectable({ providedIn: 'root' })
export class WaitlistService {
  private readonly api = inject(ApiClient);
  private readonly listEnabled = signal(false);
  private readonly optimisticEntries = signal<ReadonlyMap<string, WaitlistEntryResponse>>(
    new Map(),
  );

  readonly query = signal<TableQuery>(createInitialQuery(20));
  private readonly page = httpResource<WaitlistPageResponse>(() => {
    if (!this.listEnabled()) {
      return undefined;
    }
    return {
      url: this.api.url('/api/v1/waitlist'),
      params: toWaitlistParams(this.query()),
    };
  });

  readonly rows = computed(() => {
    const content = (this.page.value()?.content ?? []) as WaitlistEntryResponse[];
    const overrides = this.optimisticEntries();
    return content.map((entry) => {
      const override = entry.id ? overrides.get(entry.id) : undefined;
      return override ? { ...entry, ...override } : entry;
    });
  });
  readonly total = computed(() => this.page.value()?.totalElements ?? 0);
  readonly loading = computed(() => this.listEnabled() && this.page.isLoading());
  readonly loadError = computed(() => this.page.error());
  readonly error = this.loadError;

  reset(): void {
    this.listEnabled.set(false);
    this.query.set(createInitialQuery(20));
    this.optimisticEntries.set(new Map());
  }

  enableList(): void {
    this.listEnabled.set(true);
  }

  updateQuery(query: TableQuery): void {
    this.query.set(query);
  }

  reload(): void {
    this.enableList();
    this.optimisticEntries.set(new Map());
    this.page.reload();
  }

  list(query: TableQuery = this.query()): Observable<WaitlistPageResponse> {
    return this.api
      .get<WaitlistPageResponse>('/api/v1/waitlist', toHttpParams(toWaitlistParams(query)))
      .pipe(tap((page) => this.cachePage(page)));
  }

  listEntries(query: TableQuery = this.query()): Observable<WaitlistPageResponse> {
    return this.list(query);
  }

  getById(id: string): Observable<WaitlistEntryResponse> {
    return this.api
      .get<WaitlistEntryResponse>(`/api/v1/waitlist/${id}`)
      .pipe(tap((entry) => this.applyOptimistic(entry)));
  }

  addEntry(body: CreateWaitlistEntryRequest): Observable<WaitlistEntryResponse> {
    return this.api
      .post<CreateWaitlistEntryRequest, WaitlistEntryResponse>('/api/v1/waitlist', body)
      .pipe(tap((entry) => this.applyOptimistic(entry)));
  }

  create(body: CreateWaitlistEntryRequest): Observable<WaitlistEntryResponse> {
    return this.addEntry(body);
  }

  updateStatus(
    id: string,
    body: UpdateWaitlistStatusRequest | WaitlistStatus,
    discardReason?: string,
  ): Observable<WaitlistEntryResponse> {
    const request: UpdateWaitlistStatusRequest =
      typeof body === 'string' ? { status: body, discardReason } : body;
    return this.api
      .patch<UpdateWaitlistStatusRequest, WaitlistEntryResponse>(
        `/api/v1/waitlist/${id}/status`,
        request,
      )
      .pipe(tap((entry) => this.applyOptimistic(entry)));
  }

  convert(
    id: string,
    body: ConvertWaitlistEntryRequest | string,
    notes?: string,
  ): Observable<components['schemas']['AppointmentResponse']> {
    const request: ConvertWaitlistEntryRequest =
      typeof body === 'string' ? { sourceAppointmentId: body, notes } : body;
    return this.api
      .post<ConvertWaitlistEntryRequest, components['schemas']['AppointmentResponse']>(
        `/api/v1/waitlist/${id}/convert`,
        request,
      )
      .pipe(tap((appointment) => this.applyConversion(id, appointment)));
  }

  getCandidates(appointmentId: string): Observable<WaitlistEntryResponse[]> {
    return this.api.get<WaitlistEntryResponse[]>(
      `/api/v1/appointments/${appointmentId}/waitlist-candidates`,
    );
  }

  private cachePage(page: WaitlistPageResponse): void {
    for (const entry of (page.content ?? []) as WaitlistEntryResponse[]) {
      if (entry.id) {
        const current = this.optimisticEntries().get(entry.id);
        if (current) {
          this.optimisticEntries.update((entries) => new Map(entries).set(entry.id!, current));
        }
      }
    }
  }

  private applyOptimistic(entry: WaitlistEntryResponse): void {
    if (!entry.id) {
      return;
    }
    this.optimisticEntries.update((entries) => new Map(entries).set(entry.id!, entry));
  }

  private applyConversion(
    id: string,
    appointment: components['schemas']['AppointmentResponse'],
  ): void {
    const pageContent = (this.page.value()?.content ?? []) as WaitlistEntryResponse[];
    const current = this.optimisticEntries().get(id) ??
      pageContent.find((entry) => entry.id === id) ?? { id };
    this.applyOptimistic({
      ...current,
      id,
      status: 'convertida',
      convertedAt: new Date().toISOString(),
      convertedAppointmentId: appointment.id,
    });
  }
}
