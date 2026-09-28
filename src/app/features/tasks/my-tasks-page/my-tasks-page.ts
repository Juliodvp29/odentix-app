import { HttpErrorResponse } from '@angular/common/http';
import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Button } from '@shared/button/button';
import { Table } from '@shared/table/table';
import { TableColumn, TableQuery, TableRow, createInitialQuery } from '@shared/table/table-models';
import { ModalHandle, ModalService } from '@shared/modal/modal.service';
import { ToastService } from '@shared/toast/toast.service';
import { TaskReassignForm } from '../task-reassign-form/task-reassign-form';
import {
  ACTIVE_TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_PRIORITY_META,
  TASK_STATUS_META,
  TaskResponse,
  TenantMember,
  assigneeName,
  dueDateLabel,
  isActiveTask,
  taskPriorityLabel,
  taskStatusLabel,
} from '../task-models';
import { TasksService } from '../tasks.service';

export type TasksTab = 'mine' | 'all';

const PRIORITY_RANK: Record<string, number> = {
  alta: 0,
  media: 1,
  baja: 2,
};

function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 409) {
      return 'La tarea está cancelada y no se puede completar.';
    }
    const body = error.error as { message?: unknown; error?: unknown } | null;
    if (typeof body?.message === 'string') {
      return body.message;
    }
    if (typeof body?.error === 'string') {
      return body.error;
    }
  }
  return 'No pudimos completar la tarea. Intenta de nuevo.';
}

@Component({
  selector: 'app-my-tasks-page',
  imports: [Button, Table, TaskReassignForm],
  templateUrl: './my-tasks-page.html',
  host: { class: 'block' },
})
export class MyTasksPage {
  private readonly tasks = inject(TasksService);
  private readonly modals = inject(ModalService);
  private readonly toasts = inject(ToastService);
  private readonly reassignTemplate = viewChild.required<TemplateRef<unknown>>('reassignTemplate');
  private reassignDialog: ModalHandle | null = null;

  private readonly mineResource = this.tasks.myTasks();
  private readonly allResource = this.tasks.allTasks();
  private readonly membersResource = this.tasks.members();

  readonly tab = signal<TasksTab>('mine');
  readonly query = signal<TableQuery>(createInitialQuery(20));

  // Ids hidden optimistically while completion is in flight (or done,
  // until the reload lands). Completing removes the row immediately.
  private readonly hiddenIds = signal<ReadonlyArray<string>>([]);
  private readonly completingIds = signal<ReadonlyArray<string>>([]);

  private readonly activeResource = computed(() =>
    this.tab() === 'mine' ? this.mineResource : this.allResource,
  );

  readonly loading = computed(() => this.activeResource().isLoading());
  readonly loadError = computed(() => this.activeResource().error() !== undefined);
  readonly members = computed<ReadonlyArray<TenantMember>>(
    () => this.membersResource.value() ?? [],
  );
  readonly membersError = computed(() => this.membersResource.error() !== undefined);

  readonly rows = computed<TableRow[]>(() => {
    const hidden = new Set(this.hiddenIds());
    return ((this.activeResource().value() ?? []) as TaskResponse[])
      .filter((task) => isActiveTask(task) && !hidden.has(task.id ?? ''))
      .sort((a, b) => {
        const dueA = a.dueAt ?? '';
        const dueB = b.dueAt ?? '';
        if (dueA !== dueB) {
          if (!dueA) return 1;
          if (!dueB) return -1;
          return dueA < dueB ? -1 : 1;
        }
        return (PRIORITY_RANK[a.priority ?? ''] ?? 3) - (PRIORITY_RANK[b.priority ?? ''] ?? 3);
      });
  });
  readonly total = computed(() => this.rows().length);

  readonly emptyMessage = computed(() =>
    this.tab() === 'mine' ? 'No tienes tareas activas' : 'No hay tareas activas en la clínica',
  );

  readonly columns: ReadonlyArray<TableColumn> = [
    {
      key: 'title',
      header: 'Tarea',
      accessor: (row) => this.task(row).title || 'Sin título',
    },
    {
      key: 'priority',
      header: 'Prioridad',
      type: 'status',
      statusTones: Object.fromEntries(
        TASK_PRIORITIES.map((priority) => [
          TASK_PRIORITY_META[priority].label,
          TASK_PRIORITY_META[priority].tone,
        ]),
      ),
      accessor: (row) => taskPriorityLabel(this.task(row).priority),
    },
    {
      key: 'status',
      header: 'Estado',
      type: 'status',
      statusTones: Object.fromEntries(
        ACTIVE_TASK_STATUSES.map((status) => [
          TASK_STATUS_META[status].label,
          TASK_STATUS_META[status].tone,
        ]),
      ),
      accessor: (row) => taskStatusLabel(this.task(row).status),
    },
    {
      key: 'dueAt',
      header: 'Vence',
      sortable: true,
      accessor: (row) => dueDateLabel(this.task(row).dueAt),
    },
    {
      key: 'assignee',
      header: 'Responsable',
      accessor: (row) => assigneeName(this.members(), this.task(row).assignedTo),
    },
  ];

  readonly selectedTask = signal<TaskResponse | null>(null);

  task(row: TableRow): TaskResponse {
    return row as TaskResponse;
  }

  isCompleting(task: TaskResponse): boolean {
    return task.id !== undefined && this.completingIds().includes(task.id);
  }

  showTab(tab: TasksTab): void {
    if (this.tab() !== tab) {
      this.tab.set(tab);
      this.query.set(createInitialQuery(20));
    }
  }

  onQueryChange(query: TableQuery): void {
    this.query.set(query);
  }

  retry(): void {
    this.activeResource().reload();
  }

  async complete(task: TaskResponse): Promise<void> {
    const id = task.id;
    if (!id || this.isCompleting(task)) {
      return;
    }
    this.hiddenIds.update((ids) => [...ids, id]);
    this.completingIds.update((ids) => [...ids, id]);
    try {
      await firstValueFrom(this.tasks.completeTask(id));
      this.toasts.success(`Tarea completada: ${task.title || 'sin título'}.`);
      this.mineResource.reload();
      this.allResource.reload();
    } catch (error) {
      this.hiddenIds.update((ids) => ids.filter((hidden) => hidden !== id));
      this.toasts.error(errorMessage(error));
    } finally {
      this.completingIds.update((ids) => ids.filter((completing) => completing !== id));
    }
  }

  openReassign(task: TaskResponse): void {
    this.selectedTask.set(task);
    this.reassignDialog = this.modals.open(this.reassignTemplate(), {
      title: `Reasignar — ${task.title || 'tarea'}`,
    });
  }

  onReassigned(updated: TaskResponse): void {
    this.reassignDialog?.close();
    this.reassignDialog = null;
    this.selectedTask.set(null);
    const name = assigneeName(this.members(), updated.assignedTo);
    this.toasts.success(`Tarea reasignada a ${name}.`);
    this.mineResource.reload();
    this.allResource.reload();
  }

  onReassignCancelled(): void {
    this.reassignDialog?.close();
    this.reassignDialog = null;
    this.selectedTask.set(null);
  }
}
