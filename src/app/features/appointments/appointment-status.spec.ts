import {
  APPOINTMENT_STATUS_ACTIONS,
  APPOINTMENT_STATUS_META,
  APPOINTMENT_TRANSITIONS,
  AppointmentStatus,
  allowedTransitions,
} from './appointment-status';

const ALL_STATUSES: readonly AppointmentStatus[] = [
  'programada',
  'confirmada',
  'atendida',
  'no_show',
  'cancelada',
];

describe('appointment status transitions', () => {
  it('should allow programada to advance to confirmada or cancelada only', () => {
    expect([...allowedTransitions('programada')]).toEqual(['confirmada', 'cancelada']);
  });

  it('should allow confirmada to advance to atendida, no_show, or cancelada only', () => {
    expect([...allowedTransitions('confirmada')]).toEqual(['atendida', 'no_show', 'cancelada']);
  });

  it('should treat atendida, no_show, and cancelada as terminal states', () => {
    expect(allowedTransitions('atendida')).toEqual([]);
    expect(allowedTransitions('no_show')).toEqual([]);
    expect(allowedTransitions('cancelada')).toEqual([]);
  });

  it('should default a missing status to programada', () => {
    expect([...allowedTransitions(undefined)]).toEqual(['confirmada', 'cancelada']);
  });

  it('should never list programada as a transition target', () => {
    for (const targets of Object.values(APPOINTMENT_TRANSITIONS)) {
      expect(targets).not.toContain('programada');
    }
  });

  it('should define transitions for every status', () => {
    for (const status of ALL_STATUSES) {
      expect(APPOINTMENT_TRANSITIONS[status]).toBeDefined();
    }
  });
});

describe('appointment status actions', () => {
  it('should have label and variant meta for every transition target', () => {
    expect(Object.keys(APPOINTMENT_STATUS_ACTIONS).sort()).toEqual([
      'atendida',
      'cancelada',
      'confirmada',
      'no_show',
    ]);
    for (const meta of Object.values(APPOINTMENT_STATUS_ACTIONS)) {
      expect(meta.label.length).toBeGreaterThan(0);
      expect(['primary', 'secondary', 'ghost', 'danger']).toContain(meta.variant);
    }
  });

  it('should keep meta for every status', () => {
    for (const status of ALL_STATUSES) {
      expect(APPOINTMENT_STATUS_META[status].label).toBeTruthy();
      expect(APPOINTMENT_STATUS_META[status].badge).toBeTruthy();
    }
  });
});
