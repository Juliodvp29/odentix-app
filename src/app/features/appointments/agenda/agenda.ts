import { Component, computed, inject, signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import { Button } from '@shared/button/button';
import { FormField } from '@shared/form-field/form-field';
import { Select, SelectOption } from '@shared/select/select';
import { Skeleton } from '@shared/skeleton/skeleton';
import { AgendaView, addDays, dayKeyOf, formatDayEs, formatDayRangeEs } from '../agenda-dates';
import { rangeForView, todayIsoDate, weekDays, weekStart } from '../agenda-dates';
import { AppointmentResponse, AppointmentsService } from '../appointments.service';
import { AgendaDayView } from './agenda-day-view/agenda-day-view';
import { AgendaDayColumn, AgendaWeekView } from './agenda-week-view/agenda-week-view';

// Day and week agenda with prefetched neighbors for instant navigation.
@Component({
  selector: 'app-agenda',
  imports: [AgendaDayView, AgendaWeekView, Button, FormField, Select, Skeleton],
  templateUrl: './agenda.html',
  host: { class: 'block' },
})
export class AgendaPage {
  readonly view = signal<AgendaView>('day');
  readonly anchor = signal<string>(todayIsoDate());

  readonly filterModel = signal({ professionalId: '' });
  readonly filterForm = form(this.filterModel);
  readonly professionalId = computed<string | null>(
    () => this.filterForm.professionalId().value() || null,
  );

  private readonly agenda = inject(AppointmentsService);

  readonly range = computed(() => rangeForView(this.view(), this.anchor()));
  readonly rangeLabel = computed(() => formatDayRangeEs(this.view(), this.anchor()));
  readonly appointments = computed(() =>
    this.agenda.appointments(this.range(), this.professionalId()),
  );
  readonly isLoading = computed(() => !this.agenda.hasData(this.range(), this.professionalId()));
  readonly loadFailed = computed(() =>
    this.agenda.rangeFailed(this.range(), this.professionalId()),
  );
  readonly isEmpty = computed(
    () => !this.isLoading() && !this.loadFailed() && this.appointments().length === 0,
  );
  readonly professionals = computed(() => this.agenda.professionalOptions());
  readonly professionalSelectOptions = computed<SelectOption[]>(() =>
    this.professionals().map((professional) => ({
      value: professional.id,
      label: professional.name,
    })),
  );
  readonly weekColumns = computed<AgendaDayColumn[]>(() => {
    const today = todayIsoDate();
    const byDay = new Map<string, AppointmentResponse[]>();
    for (const appointment of this.appointments()) {
      const key = dayKeyOf(appointment.startsAt);
      const list = byDay.get(key) ?? [];
      list.push(appointment);
      byDay.set(key, list);
    }
    return weekDays(weekStart(this.anchor())).map((isoDate) => ({
      isoDate,
      label: formatDayEs(isoDate),
      isToday: isoDate === today,
      appointments: byDay.get(isoDate) ?? [],
    }));
  });

  constructor() {
    this.refresh();
  }

  goToPrevious(): void {
    this.shift(-1);
  }

  goToNext(): void {
    this.shift(1);
  }

  goToToday(): void {
    this.anchor.set(todayIsoDate());
    this.refresh();
  }

  setView(view: AgendaView): void {
    this.view.set(view);
    this.refresh();
  }

  onProfessionalChange(): void {
    this.refresh();
  }

  retry(): void {
    this.agenda.retry(this.range(), this.professionalId());
  }

  private shift(direction: -1 | 1): void {
    const span = this.view() === 'day' ? 1 : 7;
    this.anchor.update((current) => addDays(current, direction * span));
    this.refresh();
  }

  private refresh(): void {
    this.agenda.ensureVisibleWithNeighbors(this.view(), this.anchor(), this.professionalId());
  }
}
