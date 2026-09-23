import {
  HOUR_HEIGHT_PX,
  addDays,
  addMonths,
  dayKeyOf,
  formatDayEs,
  formatDayRangeEs,
  formatTimeEs,
  layoutBlocks,
  minutesOfDay,
  monthCells,
  rangeForView,
  toBackendInstant,
  toDateTimeLocalBogota,
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

  it('should convert datetime-local values to backend instants', () => {
    expect(toBackendInstant('2026-09-22T09:00')).toBe('2026-09-22T09:00:00-05:00');
    expect(toBackendInstant('2026-09-22T09:00:00')).toBe('2026-09-22T09:00:00-05:00');
  });

  it('should convert backend instants to Bogota datetime-local values', () => {
    expect(toDateTimeLocalBogota('2026-09-22T14:00:00Z')).toBe('2026-09-22T09:00');
    expect(toDateTimeLocalBogota(undefined)).toBe('');
    expect(toDateTimeLocalBogota('not-a-date')).toBe('');
  });

  it('should build month ranges and shift months with clamping', () => {
    expect(rangeForView('month', '2026-09-15')).toEqual({
      from: '2026-09-01T00:00:00-05:00',
      to: '2026-09-30T23:59:59-05:00',
    });
    expect(formatDayRangeEs('month', '2026-09-15')).toBe('Septiembre de 2026');
    expect(addMonths('2026-09-15', 1)).toBe('2026-10-15');
    expect(addMonths('2026-09-15', -1)).toBe('2026-08-15');
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
  });

  it('should build Monday-based month cells', () => {
    const cells = monthCells(2026, 9);
    expect(cells).toHaveLength(42);
    expect(cells[0]?.isoDate).toBe('2026-08-31');
    expect(cells[0]?.inMonth).toBe(false);
    expect(cells[1]?.isoDate).toBe('2026-09-01');
    expect(cells[1]?.inMonth).toBe(true);
    expect(cells[41]?.isoDate).toBe('2026-10-11');
  });

  it('should read local minutes from instants', () => {
    expect(minutesOfDay('2026-09-21T09:30:00')).toBe(570);
    expect(minutesOfDay(undefined)).toBeNull();
    expect(minutesOfDay('not-a-date')).toBeNull();
  });

  it('should lay overlapping blocks side by side within the workday', () => {
    const blocks = layoutBlocks([
      { startMin: 540, endMin: 570 },
      { startMin: 555, endMin: 585 },
      { startMin: 600, endMin: 630 },
    ]);
    expect(blocks[0]).toMatchObject({ column: 0, columns: 2 });
    expect(blocks[1]).toMatchObject({ column: 1, columns: 2 });
    expect(blocks[2]).toMatchObject({ column: 0, columns: 2 });
    expect(blocks[0]?.topPx).toBe(((540 - 420) / 60) * HOUR_HEIGHT_PX);
    expect(blocks[0]?.heightPx).toBe(((570 - 540) / 60) * HOUR_HEIGHT_PX);
  });

  it('should clamp blocks to the workday with a minimum height', () => {
    const blocks = layoutBlocks([
      { startMin: 360, endMin: 400 },
      { startMin: 600, endMin: 605 },
    ]);
    expect(blocks[0]?.topPx).toBe(0);
    expect(blocks[1]?.heightPx).toBe(24);
  });
});
