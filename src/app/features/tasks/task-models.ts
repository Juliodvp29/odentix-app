import { components } from '@core/api/schema';

export type TaskResponse = components['schemas']['TaskResponse'];
export type CreateTaskRequest = components['schemas']['CreateTaskRequest'];
export type UpdateTaskRequest = components['schemas']['UpdateTaskRequest'];
export type TenantMember = components['schemas']['UserSummaryDto'];

export type TaskStatus = NonNullable<TaskResponse['status']>;
export type TaskPriority = NonNullable<TaskResponse['priority']>;

export type TaskTone = 'success' | 'warning' | 'danger' | 'info' | 'teal';

export const TASK_STATUSES: ReadonlyArray<TaskStatus> = [
  'pendiente',
  'en_progreso',
  'completada',
  'cancelada',
];

export const TASK_PRIORITIES: ReadonlyArray<TaskPriority> = ['baja', 'media', 'alta'];

// Only open states appear in the active lists; completing a task moves it
// out of this set, never deletes it.
export const ACTIVE_TASK_STATUSES: ReadonlyArray<TaskStatus> = ['pendiente', 'en_progreso'];

export const TASK_STATUS_META: Record<TaskStatus, { label: string; tone: TaskTone }> = {
  pendiente: { label: 'Pendiente', tone: 'warning' },
  en_progreso: { label: 'En progreso', tone: 'info' },
  completada: { label: 'Completada', tone: 'success' },
  cancelada: { label: 'Cancelada', tone: 'danger' },
};

// Priority is emphasis, not status: a single accent scale instead of the
// semantic palette used for states.
export const TASK_PRIORITY_META: Record<TaskPriority, { label: string; tone: TaskTone }> = {
  baja: { label: 'Baja', tone: 'teal' },
  media: { label: 'Media', tone: 'info' },
  alta: { label: 'Alta', tone: 'warning' },
};

export function isActiveTask(task: Pick<TaskResponse, 'status'>): boolean {
  return task.status === 'pendiente' || task.status === 'en_progreso';
}

export function taskStatusLabel(status: TaskStatus | null | undefined): string {
  if (!status) {
    return 'Sin estado';
  }
  return TASK_STATUS_META[status]?.label ?? status;
}

export function taskPriorityLabel(priority: TaskPriority | null | undefined): string {
  if (!priority) {
    return '—';
  }
  return TASK_PRIORITY_META[priority]?.label ?? priority;
}

// Resolves the assignee id against the tenant member list. The task
// endpoint only carries the id, so names come from GET /api/v1/users.
export function assigneeName(
  members: ReadonlyArray<Pick<TenantMember, 'id' | 'fullName'>>,
  assignedTo: string | null | undefined,
): string {
  if (!assignedTo) {
    return 'Sin asignar';
  }
  return members.find((member) => member.id === assignedTo)?.fullName || 'Sin asignar';
}

// Keeps the ISO instant intact for sorting, shows only the calendar date.
export function dueDateLabel(dueAt: string | null | undefined): string {
  if (!dueAt) {
    return 'Sin fecha';
  }
  return dueAt.slice(0, 10);
}
