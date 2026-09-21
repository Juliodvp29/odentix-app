// Pure date helpers for the agenda. Day boundaries use the browser's local
// time; appointment instants from the backend are grouped by that same day.
export type AgendaView = 'day' | 'week';

export interface DateRange {
  readonly from: string;
  readonly to: string;
}

// Fixed Bogota offset (America/Bogota has no daylight saving time). Range
// bounds carry it because the backend binds them to Instant, which rejects
// ISO-8601 without a zone.
const BOGOTA_OFFSET = '-05:00';

const DAY_MS = 24 * 60 * 60 * 1000;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function todayIsoDate(now: Date = new Date()): string {
  return formatIsoDate(now);
}

export function addDays(isoDate: string, days: number): string {
  return formatIsoDate(new Date(parseIsoDate(isoDate).getTime() + days * DAY_MS));
}

// Monday-based week start (Colombia), returned as an ISO date.
export function weekStart(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  const mondayOffset = (date.getDay() + 6) % 7;
  return formatIsoDate(new Date(date.getTime() - mondayOffset * DAY_MS));
}

export function weekDays(mondayIsoDate: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(mondayIsoDate, index));
}

// Backend range for a view anchored at the given ISO date, date-time bounds
// in Bogota time so day limits match the clinic's day.
export function rangeForView(view: AgendaView, anchorIsoDate: string): DateRange {
  const start = view === 'day' ? anchorIsoDate : weekStart(anchorIsoDate);
  const end = view === 'day' ? anchorIsoDate : addDays(start, 6);
  return { from: `${start}T00:00:00${BOGOTA_OFFSET}`, to: `${end}T23:59:59${BOGOTA_OFFSET}` };
}

// Local-time ISO date (yyyy-mm-dd) of an instant, used to group appointments.
export function dayKeyOf(instant: string | undefined): string {
  if (!instant) {
    return '';
  }
  return formatIsoDate(new Date(instant));
}

const dayFormatter = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const timeFormatter = new Intl.DateTimeFormat('es-CO', {
  hour: 'numeric',
  minute: '2-digit',
});

export function formatDayEs(isoDate: string): string {
  const label = dayFormatter.format(parseIsoDate(isoDate));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatTimeEs(instant: string | undefined): string {
  if (!instant) {
    return '';
  }
  return timeFormatter.format(new Date(instant));
}

export function formatDayRangeEs(view: AgendaView, anchorIsoDate: string): string {
  if (view === 'day') {
    return formatDayEs(anchorIsoDate);
  }
  const days = weekDays(weekStart(anchorIsoDate));
  const first = days[0];
  const last = days[days.length - 1];
  if (!first || !last) {
    return '';
  }
  return `${formatDayEs(first)} – ${formatDayEs(last)}`;
}
