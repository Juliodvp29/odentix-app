// Pure date helpers for the agenda. Day boundaries use the browser's local
// time; appointment instants from the backend are grouped by that same day.
export type AgendaView = 'day' | 'week' | 'month';

export interface DateRange {
  readonly from: string;
  readonly to: string;
}

// Fixed Bogota offset (America/Bogota has no daylight saving time). Range
// bounds carry it because the backend binds them to Instant, which rejects
// ISO-8601 without a zone.
const BOGOTA_OFFSET = '-05:00';

// Visible workday for the time grid, in local hours.
export const WORKDAY_START_HOUR = 7;
export const WORKDAY_END_HOUR = 19;
export const HOUR_HEIGHT_PX = 64;

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
  if (view === 'month') {
    const [year, month] = anchorIsoDate.split('-').map(Number);
    const lastDay = new Date(year ?? 2026, month ?? 1, 0).getDate();
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return {
      from: `${prefix}-01T00:00:00${BOGOTA_OFFSET}`,
      to: `${prefix}-${pad(lastDay)}T23:59:59${BOGOTA_OFFSET}`,
    };
  }
  const start = view === 'day' ? anchorIsoDate : weekStart(anchorIsoDate);
  const end = view === 'day' ? anchorIsoDate : addDays(start, 6);
  return { from: `${start}T00:00:00${BOGOTA_OFFSET}`, to: `${end}T23:59:59${BOGOTA_OFFSET}` };
}

// datetime-local value (no zone) to a backend Instant in Bogota time.
export function toBackendInstant(localDateTime: string): string {
  const normalized = localDateTime.length <= 16 ? `${localDateTime}:00` : localDateTime;
  return `${normalized}${BOGOTA_OFFSET}`;
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
  if (view === 'month') {
    const label = monthFormatter.format(parseIsoDate(`${anchorIsoDate.slice(0, 7)}-01`));
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  const days = weekDays(weekStart(anchorIsoDate));
  const first = days[0];
  const last = days[days.length - 1];
  if (!first || !last) {
    return '';
  }
  return `${formatDayEs(first)} – ${formatDayEs(last)}`;
}

export function addMonths(isoDate: string, months: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const lastDay = new Date((year ?? 2026) + 0, (month ?? 1) + months, 0).getDate();
  const clampedDay = Math.min(day ?? 1, lastDay);
  const target = new Date(year ?? 2026, (month ?? 1) - 1 + months, clampedDay);
  return formatIsoDate(target);
}

export interface MonthCell {
  readonly isoDate: string;
  readonly dayNumber: number;
  readonly inMonth: boolean;
}

// 42 cells (6 rows) starting on Monday for the given month (1-12).
export function monthCells(year: number, month: number): MonthCell[] {
  const first = new Date(year, month - 1, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month - 1, 1 - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    return {
      isoDate: formatIsoDate(date),
      dayNumber: date.getDate(),
      inMonth: date.getMonth() === month - 1,
    };
  });
}

// Local-time minutes since midnight for positioning on the time grid.
export function minutesOfDay(instant: string | undefined): number | null {
  if (!instant) {
    return null;
  }
  const date = new Date(instant);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.getHours() * 60 + date.getMinutes();
}

export interface PositionedBlock {
  readonly topPx: number;
  readonly heightPx: number;
  readonly column: number;
  readonly columns: number;
}

// Greedy overlap columns for blocks sharing a time-grid column. Positions
// clamp to the workday with a minimum height; nothing is dropped.
export function layoutBlocks(
  spans: ReadonlyArray<{ startMin: number; endMin: number }>,
): PositionedBlock[] {
  const dayStart = WORKDAY_START_HOUR * 60;
  const dayEnd = WORKDAY_END_HOUR * 60;
  const ordered = spans
    .map((span, index) => ({ span, index }))
    .sort((left, right) => left.span.startMin - right.span.startMin || left.index - right.index);
  const columnsEnd: number[] = [];
  const assigned: Array<{
    span: { startMin: number; endMin: number };
    index: number;
    column: number;
  }> = [];
  ordered.forEach(({ span, index }, order) => {
    const start = Math.max(span.startMin, dayStart);
    const end = Math.max(Math.min(span.endMin, dayEnd), start);
    let column = columnsEnd.findIndex((columnEnd) => columnEnd <= start);
    if (column === -1) {
      column = columnsEnd.length;
      columnsEnd.push(end);
    } else {
      columnsEnd[column] = end;
    }
    assigned[order] = { span: { startMin: start, endMin: end }, index, column };
  });
  const total = Math.max(columnsEnd.length, 1);
  const result: PositionedBlock[] = new Array(spans.length);
  for (const { span, index, column } of assigned) {
    const topPx = ((span.startMin - dayStart) / 60) * HOUR_HEIGHT_PX;
    const heightPx = Math.max(24, ((span.endMin - span.startMin) / 60) * HOUR_HEIGHT_PX);
    result[index] = { topPx, heightPx, column, columns: total };
  }
  return result;
}

const monthFormatter = new Intl.DateTimeFormat('es-CO', {
  month: 'long',
  year: 'numeric',
});
