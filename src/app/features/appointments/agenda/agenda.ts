import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { form } from '@angular/forms/signals';
import { Button } from '@shared/button/button';
import { FormField } from '@shared/form-field/form-field';
import { Icon } from '@shared/icon/icon';
import { ModalHandle, ModalService } from '@shared/modal/modal.service';
import { Select, SelectOption } from '@shared/select/select';
import { Skeleton } from '@shared/skeleton/skeleton';
import {
  AgendaView,
  addDays,
  addMonths,
  dayKeyOf,
  formatDayEs,
  formatDayRangeEs,
  monthCells,
} from '../agenda-dates';
import { rangeForView, todayIsoDate, weekDays, weekStart } from '../agenda-dates';
import { APPOINTMENT_STATUS_META } from '../appointment-status';
import { AppointmentResponse, AppointmentsService } from '../appointments.service';
import { AgendaDayColumn, AgendaWeekView } from './agenda-week-view/agenda-week-view';
import { AgendaDetailPanel } from './agenda-detail-panel/agenda-detail-panel';
import { AgendaMiniCalendar } from './agenda-mini-calendar/agenda-mini-calendar';
import { AgendaMonthView, MonthDayColumn } from './agenda-month-view/agenda-month-view';
import { AgendaTimeGrid, TimeGridColumn } from './agenda-time-grid/agenda-time-grid';
import { AppointmentForm } from './appointment-form/appointment-form';

// Base tones appear only as small status dots, never as fills.
const STATUS_DOTS: Record<string, string> = {
  programada: 'bg-info',
  confirmada: 'bg-teal',
  atendida: 'bg-success',
  no_show: 'bg-warning',
  cancelada: 'bg-danger',
};

const VIEW_TABS: ReadonlyArray<{ value: AgendaView; label: string }> = [
  { value: 'day', label: 'Día' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
];

// Day, week, and month agenda with prefetched neighbors for instant navigation.
@Component({
  selector: 'app-agenda',
  imports: [
    AgendaDetailPanel,
    AgendaMiniCalendar,
    AgendaMonthView,
    AgendaTimeGrid,
    AgendaWeekView,
    AppointmentForm,
    Button,
    FormField,
    Icon,
    Select,
    Skeleton,
  ],
  templateUrl: './agenda.html',
  host: { class: 'block' },
})
export class AgendaPage {
  readonly view = signal<AgendaView>('day');
  readonly anchor = signal<string>(todayIsoDate());
  readonly daySearch = signal('');
  readonly selectedId = signal<string | null>(null);
  readonly viewTabs = VIEW_TABS;

  readonly filterModel = signal({ professionalId: '', roomId: '' });
  readonly filterForm = form(this.filterModel);
  readonly professionalId = computed<string | null>(
    () => this.filterForm.professionalId().value() || null,
  );
  readonly roomId = computed<string | null>(() => this.filterForm.roomId().value() || null);

  private readonly agenda = inject(AppointmentsService);
  private readonly modal = inject(ModalService);
  private readonly createTemplate = viewChild.required<TemplateRef<unknown>>('createTemplate');
  private createDialog: ModalHandle | null = null;

  readonly range = computed(() => rangeForView(this.view(), this.anchor()));
  readonly rangeLabel = computed(() => formatDayRangeEs(this.view(), this.anchor()));
  readonly appointments = computed(() => {
    const roomId = this.roomId();
    const all = this.agenda.appointments(this.range(), this.professionalId());
    return roomId ? all.filter((appointment) => appointment.roomId === roomId) : all;
  });
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
  readonly roomSelectOptions = computed<SelectOption[]>(() =>
    this.agenda.roomOptions().map((room) => ({ value: room.id, label: room.name })),
  );
  readonly dayAppointments = computed(() => {
    const query = this.daySearch().trim().toLowerCase();
    const appointments = this.appointments();
    if (!query) {
      return appointments;
    }
    return appointments.filter((appointment) =>
      (appointment.patientName ?? '').toLowerCase().includes(query),
    );
  });
  readonly statusCounts = computed(() => {
    const counts: Record<string, number> = {
      programada: 0,
      confirmada: 0,
      atendida: 0,
      no_show: 0,
      cancelada: 0,
    };
    for (const appointment of this.appointments()) {
      const status = appointment.status ?? 'programada';
      counts[status] = (counts[status] ?? 0) + 1;
    }
    return counts;
  });
  readonly statusLegend = Object.entries(APPOINTMENT_STATUS_META).map(([status, meta]) => ({
    status,
    ...meta,
    dot: STATUS_DOTS[status] ?? 'bg-mid-gray',
  }));
  readonly timeGridColumns = computed<TimeGridColumn[]>(() => {
    const byProfessional = new Map<string | null, AppointmentResponse[]>();
    for (const appointment of this.dayAppointments()) {
      const key = appointment.professionalId ?? null;
      const list = byProfessional.get(key) ?? [];
      list.push(appointment);
      byProfessional.set(key, list);
    }
    return [...byProfessional.entries()].map(([id, list]) => ({
      professionalId: id,
      professionalName: list[0]?.professionalName ?? (id === null ? 'Sin asignar' : 'Profesional'),
      appointments: [...list].sort((left, right) =>
        (left.startsAt ?? '').localeCompare(right.startsAt ?? ''),
      ),
    }));
  });
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
  readonly monthDays = computed<MonthDayColumn[]>(() => {
    const today = todayIsoDate();
    const anchor = this.anchor();
    const [year, month] = anchor.split('-').map(Number);
    const byDay = new Map<string, AppointmentResponse[]>();
    for (const appointment of this.appointments()) {
      const key = dayKeyOf(appointment.startsAt);
      const list = byDay.get(key) ?? [];
      list.push(appointment);
      byDay.set(key, list);
    }
    return monthCells(year ?? 2026, month ?? 1).map((cell) => ({
      cell,
      appointments: byDay.get(cell.isoDate) ?? [],
      isToday: cell.isoDate === today,
      isSelected: cell.isoDate === anchor,
    }));
  });
  readonly selectedAppointment = computed<AppointmentResponse | null>(
    () => this.appointments().find((appointment) => appointment.id === this.selectedId()) ?? null,
  );

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
    this.selectedId.set(null);
    this.refresh();
  }

  setView(view: AgendaView): void {
    this.view.set(view);
    this.selectedId.set(null);
    this.refresh();
  }

  goToMonth(direction: -1 | 1): void {
    this.anchor.update((current) => addMonths(current, direction));
    this.refresh();
  }

  pickDay(isoDate: string): void {
    this.anchor.set(isoDate);
    this.view.set('day');
    this.selectedId.set(null);
    this.refresh();
  }

  pickAppointment(appointment: AppointmentResponse): void {
    this.selectedId.set(appointment.id ?? null);
  }

  closeDetail(): void {
    this.selectedId.set(null);
  }

  onFilterChange(): void {
    this.selectedId.set(null);
    this.refresh();
  }

  onDaySearch(event: Event): void {
    this.daySearch.set((event.target as HTMLInputElement).value);
  }

  reloadRanges(): void {
    this.refresh();
  }

  retry(): void {
    this.agenda.retry(this.range(), this.professionalId());
  }

  openCreateForm(): void {
    this.createDialog = this.modal.open(this.createTemplate(), { title: 'Agendar cita' });
  }

  onAppointmentSaved(): void {
    this.createDialog?.close();
    this.createDialog = null;
    this.agenda.invalidateAll();
    this.refresh();
  }

  onCreateCancelled(): void {
    this.createDialog?.close();
    this.createDialog = null;
  }

  private shift(direction: -1 | 1): void {
    const view = this.view();
    if (view === 'month') {
      this.anchor.update((current) => addMonths(current, direction));
    } else {
      const span = view === 'day' ? 1 : 7;
      this.anchor.update((current) => addDays(current, direction * span));
    }
    this.selectedId.set(null);
    this.refresh();
  }

  private refresh(): void {
    this.agenda.ensureVisibleWithNeighbors(this.view(), this.anchor(), this.professionalId());
  }
}
