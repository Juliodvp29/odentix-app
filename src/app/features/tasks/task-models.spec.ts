import { describe, expect, it } from 'vitest';
import {
  assigneeName,
  dueDateLabel,
  isActiveTask,
  taskPriorityLabel,
  taskStatusLabel,
} from './task-models';

describe('isActiveTask', () => {
  it('should treat pending and in-progress tasks as active', () => {
    expect(isActiveTask({ status: 'pendiente' })).toBe(true);
    expect(isActiveTask({ status: 'en_progreso' })).toBe(true);
  });

  it('should treat completed and cancelled tasks as inactive', () => {
    expect(isActiveTask({ status: 'completada' })).toBe(false);
    expect(isActiveTask({ status: 'cancelada' })).toBe(false);
  });
});

describe('taskStatusLabel', () => {
  it('should label every known status in Spanish', () => {
    expect(taskStatusLabel('pendiente')).toBe('Pendiente');
    expect(taskStatusLabel('en_progreso')).toBe('En progreso');
    expect(taskStatusLabel('completada')).toBe('Completada');
    expect(taskStatusLabel('cancelada')).toBe('Cancelada');
  });

  it('should fall back for missing statuses', () => {
    expect(taskStatusLabel(null)).toBe('Sin estado');
    expect(taskStatusLabel(undefined)).toBe('Sin estado');
  });
});

describe('taskPriorityLabel', () => {
  it('should label every known priority in Spanish', () => {
    expect(taskPriorityLabel('baja')).toBe('Baja');
    expect(taskPriorityLabel('media')).toBe('Media');
    expect(taskPriorityLabel('alta')).toBe('Alta');
  });

  it('should fall back for missing priorities', () => {
    expect(taskPriorityLabel(null)).toBe('—');
    expect(taskPriorityLabel(undefined)).toBe('—');
  });
});

describe('assigneeName', () => {
  const members = [
    { id: 'user-1', fullName: 'Ana Torres' },
    { id: 'user-2', fullName: 'Carlos Pérez' },
  ];

  it('should resolve the assignee id against the member list', () => {
    expect(assigneeName(members, 'user-2')).toBe('Carlos Pérez');
  });

  it('should fall back when the task has no assignee or the member is unknown', () => {
    expect(assigneeName(members, null)).toBe('Sin asignar');
    expect(assigneeName(members, undefined)).toBe('Sin asignar');
    expect(assigneeName(members, 'user-9')).toBe('Sin asignar');
  });
});

describe('dueDateLabel', () => {
  it('should show only the calendar date of an instant', () => {
    expect(dueDateLabel('2026-09-30T15:00:00Z')).toBe('2026-09-30');
  });

  it('should fall back when there is no due date', () => {
    expect(dueDateLabel(null)).toBe('Sin fecha');
    expect(dueDateLabel(undefined)).toBe('Sin fecha');
  });
});
