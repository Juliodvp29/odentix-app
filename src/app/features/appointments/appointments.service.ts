import { HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '@core/api/api-client';
import { components } from '@core/api/schema';
import { AgendaView, DateRange, addDays, addMonths, rangeForView, weekStart } from './agenda-dates';

export type AppointmentResponse = components['schemas']['AppointmentResponse'];
export type CreateAppointmentRequest = components['schemas']['CreateAppointmentRequest'];
export type PagePatientResponse = components['schemas']['PagePatientResponse'];

export interface ProfessionalOption {
  readonly id: string;
  readonly name: string;
}

export interface RoomOption {
  readonly id: string;
  readonly name: string;
}

interface RangeState {
  appointments: AppointmentResponse[];
  failed: boolean;
}

function rangeKey(range: DateRange, professionalId: string | null): string {
  return `${range.from}|${range.to}|${professionalId ?? ''}`;
}

// Range cache for the agenda. The visible range plus its neighbors are kept
// loaded, so moving between days or weeks usually renders instantly instead
// of showing a loader on every navigation.
@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private readonly api = inject(ApiClient);

  private readonly ranges = signal<ReadonlyMap<string, RangeState>>(new Map());
  private readonly inFlight = new Set<string>();

  appointments(range: DateRange, professionalId: string | null): AppointmentResponse[] {
    return this.ranges().get(rangeKey(range, professionalId))?.appointments ?? [];
  }

  hasData(range: DateRange, professionalId: string | null): boolean {
    return this.ranges().has(rangeKey(range, professionalId));
  }

  rangeFailed(range: DateRange, professionalId: string | null): boolean {
    return this.ranges().get(rangeKey(range, professionalId))?.failed ?? false;
  }

  professionalOptions(): ProfessionalOption[] {
    const seen = new Map<string, string>();
    for (const state of this.ranges().values()) {
      for (const appointment of state.appointments) {
        if (appointment.professionalId && appointment.professionalName) {
          seen.set(appointment.professionalId, appointment.professionalName);
        }
      }
    }
    return [...seen.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name, 'es'));
  }

  roomOptions(): RoomOption[] {
    const seen = new Map<string, string>();
    for (const state of this.ranges().values()) {
      for (const appointment of state.appointments) {
        if (appointment.roomId && appointment.roomName) {
          seen.set(appointment.roomId, appointment.roomName);
        }
      }
    }
    return [...seen.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name, 'es'));
  }

  createAppointment(body: CreateAppointmentRequest) {
    return this.api.post<CreateAppointmentRequest, AppointmentResponse>(
      '/api/v1/appointments',
      body,
    );
  }

  invalidateAll(): void {
    this.ranges.set(new Map());
  }

  ensureRange(range: DateRange, professionalId: string | null, force = false): void {
    const key = rangeKey(range, professionalId);
    if (this.inFlight.has(key)) {
      return;
    }
    const cached = this.ranges().get(key);
    if (!force && cached && !cached.failed) {
      return;
    }
    this.inFlight.add(key);
    void firstValueFrom(this.fetchRange(range, professionalId))
      .then((appointments) => {
        this.store(key, { appointments, failed: false });
      })
      .catch(() => {
        this.store(key, { appointments: cached?.appointments ?? [], failed: true });
      })
      .finally(() => {
        this.inFlight.delete(key);
      });
  }

  ensureVisibleWithNeighbors(
    view: AgendaView,
    anchorIsoDate: string,
    professionalId: string | null,
  ): void {
    if (view === 'month') {
      this.ensureRange(rangeForView(view, anchorIsoDate), professionalId);
      this.ensureRange(rangeForView(view, addMonths(anchorIsoDate, -1)), professionalId);
      this.ensureRange(rangeForView(view, addMonths(anchorIsoDate, 1)), professionalId);
      return;
    }
    const visible = rangeForView(view, anchorIsoDate);
    const spanDays = view === 'day' ? 1 : 7;
    const base = view === 'day' ? anchorIsoDate : weekStart(anchorIsoDate);
    this.ensureRange(visible, professionalId);
    this.ensureRange(rangeForView(view, addDays(base, -spanDays)), professionalId);
    this.ensureRange(rangeForView(view, addDays(base, spanDays)), professionalId);
  }

  retry(range: DateRange, professionalId: string | null): void {
    this.ensureRange(range, professionalId, true);
  }

  private fetchRange(range: DateRange, professionalId: string | null) {
    let params = new HttpParams().set('from', range.from).set('to', range.to);
    if (professionalId) {
      params = params.set('professionalId', professionalId);
    }
    return this.api.get<AppointmentResponse[]>('/api/v1/appointments', params);
  }

  private store(key: string, state: RangeState): void {
    this.ranges.update((ranges) => new Map(ranges).set(key, state));
  }
}
