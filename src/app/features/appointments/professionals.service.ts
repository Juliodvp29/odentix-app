import { httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '@core/api/api-client';
import { components } from '@core/api/schema';

export type ProfessionalResponse = components['schemas']['ProfessionalResponse'];
export type RoomResponse = components['schemas']['RoomResponse'];
export type CreateProfessionalRequest = components['schemas']['CreateProfessionalRequest'];

export interface DirectoryOption {
  readonly id: string;
  readonly name: string;
}

export function toDirectoryOptions(
  items: ReadonlyArray<{ id?: string | null; fullName?: string | null; name?: string | null }>,
): DirectoryOption[] {
  return items
    .filter((item) => Boolean(item.id))
    .map((item) => ({
      id: item.id as string,
      name: item.fullName ?? item.name ?? 'Sin nombre',
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'es'));
}

// Clinic directory: professionals and rooms from the backend instead of
// deriving them from loaded agenda ranges (which hid anyone without
// appointments, like external specialists).
@Injectable({ providedIn: 'root' })
export class ProfessionalsService {
  private readonly api = inject(ApiClient);

  private readonly professionalsResource = httpResource<ProfessionalResponse[]>(() => ({
    url: this.api.url('/api/v1/professionals'),
    params: { onlyActive: 'true' },
  }));

  private readonly roomsResource = httpResource<RoomResponse[]>(() => ({
    url: this.api.url('/api/v1/rooms'),
  }));

  readonly professionals = this.professionalsResource.value;
  readonly professionalsLoading = this.professionalsResource.isLoading;
  readonly professionalsError = this.professionalsResource.error;

  readonly rooms = this.roomsResource.value;
  readonly roomsLoading = this.roomsResource.isLoading;
  readonly roomsError = this.roomsResource.error;

  professionalOptions(): DirectoryOption[] {
    return toDirectoryOptions(this.professionals() ?? []);
  }

  roomOptions(): DirectoryOption[] {
    return toDirectoryOptions(this.rooms() ?? []);
  }

  // Creates a professional (owner-only on the backend).
  createProfessional(body: CreateProfessionalRequest): Observable<ProfessionalResponse> {
    return this.api.post<CreateProfessionalRequest, ProfessionalResponse>(
      '/api/v1/professionals',
      body,
    );
  }

  retry(): void {
    this.professionalsResource.reload();
    this.roomsResource.reload();
  }
}
