import { HttpResourceRef, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '@core/api/api-client';
import { TaskResponse, TenantMember, UpdateTaskRequest } from './task-models';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly api = inject(ApiClient);

  // Reactive resource for the current user's tasks.
  myTasks(): HttpResourceRef<TaskResponse[] | undefined> {
    return httpResource<TaskResponse[]>(() => ({
      url: this.api.url('/api/v1/tasks/mine'),
    }));
  }

  // Reactive resource for every task in the active tenant.
  allTasks(): HttpResourceRef<TaskResponse[] | undefined> {
    return httpResource<TaskResponse[]>(() => ({
      url: this.api.url('/api/v1/tasks'),
    }));
  }

  // Reactive resource for the tenant member list, used to resolve
  // assignee names and to build the reassign picker.
  members(): HttpResourceRef<TenantMember[] | undefined> {
    return httpResource<TenantMember[]>(() => ({
      url: this.api.url('/api/v1/users'),
    }));
  }

  // Marks a task as completed. Idempotent; a cancelled task
  // fails with 409, surfaced to the caller for a specific message.
  completeTask(id: string): Observable<TaskResponse> {
    return this.api.post<Record<string, never>, TaskResponse>(`/api/v1/tasks/${id}/complete`, {});
  }

  // Reassigns a task to another tenant member. The backend validates
  // that the new assignee belongs to the tenant (404 otherwise).
  reassignTask(id: string, assignedTo: string): Observable<TaskResponse> {
    const body: UpdateTaskRequest = { assignedTo };
    return this.api.patch<UpdateTaskRequest, TaskResponse>(`/api/v1/tasks/${id}`, body);
  }
}
