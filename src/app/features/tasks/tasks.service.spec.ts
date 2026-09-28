import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ApiClient } from '@core/api/api-client';
import { TaskResponse } from './task-models';
import { TasksService } from './tasks.service';

const MOCK_TASK: TaskResponse = {
  id: 'task-1',
  title: 'Llamar al paciente',
  status: 'pendiente',
  priority: 'alta',
};

describe('TasksService', () => {
  let service: TasksService;
  let api: ApiClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TasksService,
        {
          provide: ApiClient,
          useValue: {
            url: (path: string) => `http://localhost:8081${path}`,
            get: vi.fn(),
            post: vi.fn(),
            patch: vi.fn(),
          },
        },
      ],
    });
    service = TestBed.inject(TasksService);
    api = TestBed.inject(ApiClient);
  });

  it('should complete a task through the complete endpoint', () => {
    vi.spyOn(api, 'post').mockReturnValue(of({ ...MOCK_TASK, status: 'completada' }));

    let result: TaskResponse | undefined;
    service.completeTask('task-1').subscribe((res) => {
      result = res;
    });

    expect(api.post).toHaveBeenCalledWith('/api/v1/tasks/task-1/complete', {});
    expect(result?.status).toBe('completada');
  });

  it('should reassign a task by patching its assignee', () => {
    vi.spyOn(api, 'patch').mockReturnValue(of({ ...MOCK_TASK, assignedTo: 'user-2' }));

    let result: TaskResponse | undefined;
    service.reassignTask('task-1', 'user-2').subscribe((res) => {
      result = res;
    });

    expect(api.patch).toHaveBeenCalledWith('/api/v1/tasks/task-1', {
      assignedTo: 'user-2',
    });
    expect(result?.assignedTo).toBe('user-2');
  });
});
