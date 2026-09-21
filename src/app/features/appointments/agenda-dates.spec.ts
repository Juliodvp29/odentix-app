import {
  addDays,
  dayKeyOf,
  formatDayEs,
  formatDayRangeEs,
  formatTimeEs,
  rangeForView,
  todayIsoDate,
  weekDays,
  weekStart,
} from './agenda-dates';

describe('agenda-dates', () => {
  it('should report today as an ISO date', () => {
    expect(todayIsoDate(new Date(2026, 8, 21, 15, 30))).toBe('2026-09-21');
  });

  it('should add and subtract days across month boundaries', () => {
    expect(addDays('2026-09-21', 1)).toBe('2026-09-22');
    expect(addDays('2026-09-21', -1)).toBe('2026-09-20');
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
  });

  it('should start weeks on Monday', () => {
    // 2026-09-21 is a Monday.
    expect(weekStart('2026-09-21')).toBe('2026-09-21');
    expect(weekStart('2026-09-23')).toBe('2026-09-21');
    expect(weekStart('2026-09-27')).toBe('2026-09-21');
    expect(weekDays('2026-09-21')).toEqual([
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
      '2026-09-24',
      '2026-09-25',
      '2026-09-26',
      '2026-09-27',
    ]);
  });

  it('should build backend ranges for day and week views', () => {
    expect(rangeForView('day', '2026-09-21')).toEqual({
      from: '2026-09-21T00:00:00-05:00',
      to: '2026-09-21T23:59:59-05:00',
    });
    expect(rangeForView('week', '2026-09-23')).toEqual({
      from: '2026-09-21T00:00:00-05:00',
      to: '2026-09-27T23:59:59-05:00',
    });
  });

  it('should group instants by local day', () => {
    expect(dayKeyOf('2026-09-21T14:30:00')).toBe('2026-09-21');
    expect(dayKeyOf(undefined)).toBe('');
  });

  it('should format days and times in Spanish', () => {
    expect(formatDayEs('2026-09-21')).toContain('septiembre');
    expect(formatDayRangeEs('day', '2026-09-21')).toContain('septiembre');
    expect(formatDayRangeEs('week', '2026-09-23')).toContain('–');
    expect(formatTimeEs('2026-09-21T14:30:00')).toContain('2:30');
    expect(formatTimeEs(undefined)).toBe('');
  });
});
