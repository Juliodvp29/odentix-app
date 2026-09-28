import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { MyTasksPage } from './my-tasks-page';
import { TaskResponse, TenantMember } from '../task-models';
import { TasksService } from '../tasks.service';
import { ModalService } from '@shared/modal/modal.service';
import { ToastService } from '@shared/toast/toast.service';

const MEMBERS: TenantMember[] = [
  { id: 'user-1', fullName: 'Ana Torres', role: 'recepcion' },
  { id: 'user-2', fullName: 'Carlos Pérez', role: 'odontologo' },
];

const MINE: TaskResponse[] = [
  {
    id: 't-1',
    title: 'Confirmar cita de ortodoncia',
    status: 'pendiente',
    priority: 'alta',
    assignedTo: 'user-1',
    dueAt: '2026-09-30T10:00:00Z',
  },
  {
    id: 't-2',
    title: 'Tarea ya terminada',
    status: 'completada',
    priority: 'baja',
    assignedTo: 'user-1',
  },
];

const ALL: TaskResponse[] = [
  {
    id: 't-3',
    title: 'Revisar inventario de resina',
    status: 'en_progreso',
    priority: 'media',
    assignedTo: 'user-2',
  },
];

describe('MyTasksPage', () => {
  let fixture: ComponentFixture<MyTasksPage>;
  let completeTask: ReturnType<typeof vi.fn>;
  let reloadMine: ReturnType<typeof vi.fn>;
  let reloadAll: ReturnType<typeof vi.fn>;
  let toastSuccess: ReturnType<typeof vi.fn>;
  let toastError: ReturnType<typeof vi.fn>;
  let modalOpen: ReturnType<typeof vi.fn>;

  function setup(
    mine: TaskResponse[] | null = MINE,
    all: TaskResponse[] | null = ALL,
    error: unknown = undefined,
  ) {
    const mineResource = {
      value: signal(mine),
      isLoading: signal(mine === null && error === undefined),
      error: signal(error),
      reload: vi.fn(),
    };
    const allResource = {
      value: signal(all),
      isLoading: signal(false),
      error: signal(undefined),
      reload: vi.fn(),
    };
    const membersResource = {
      value: signal(MEMBERS),
      isLoading: signal(false),
      error: signal(undefined),
      reload: vi.fn(),
    };
    reloadMine = mineResource.reload;
    reloadAll = allResource.reload;
    completeTask = vi.fn().mockReturnValue(of({ ...MINE[0], status: 'completada' }));
    toastSuccess = vi.fn();
    toastError = vi.fn();
    modalOpen = vi.fn(() => ({ close: vi.fn(), closed: of(null) }));

    TestBed.configureTestingModule({
      imports: [MyTasksPage],
      providers: [
        provideRouter([]),
        {
          provide: TasksService,
          useValue: {
            myTasks: () => mineResource,
            allTasks: () => allResource,
            members: () => membersResource,
            completeTask,
          },
        },
        { provide: ModalService, useValue: { open: modalOpen } },
        { provide: ToastService, useValue: { success: toastSuccess, error: toastError } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyTasksPage);
    fixture.detectChanges();
  }

  it('should render active mine tasks with resolved names and labels', () => {
    setup();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Confirmar cita de ortodoncia');
    expect(text).toContain('Ana Torres');
    expect(text).toContain('Pendiente');
    expect(text).toContain('Alta');
    expect(text).toContain('2026-09-30');
    expect(text).not.toContain('Tarea ya terminada');
  });

  it('should show the mine empty state without active tasks', () => {
    setup([]);
    expect(fixture.nativeElement.textContent).toContain('No tienes tareas activas');
  });

  it('should switch to the all tab on demand', () => {
    setup();
    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]');
    (tabs[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Revisar inventario de resina');
    expect(text).toContain('Carlos Pérez');
    expect(text).not.toContain('Confirmar cita de ortodoncia');
  });

  it('should remove a completed task immediately with a toast', async () => {
    setup();
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    buttons.find((button) => button.textContent?.includes('Completar'))?.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Confirmar cita de ortodoncia');

    await fixture.whenStable();
    expect(completeTask).toHaveBeenCalledWith('t-1');
    expect(toastSuccess).toHaveBeenCalled();
    expect(reloadMine).toHaveBeenCalled();
    expect(reloadAll).toHaveBeenCalled();
  });

  it('should restore the task and explain when completion fails', async () => {
    setup();
    completeTask.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    buttons.find((button) => button.textContent?.includes('Completar'))?.click();

    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Confirmar cita de ortodoncia');
    expect(toastError).toHaveBeenCalledWith('La tarea está cancelada y no se puede completar.');
  });

  it('should retry when loading fails', () => {
    setup(null, ALL, new Error('fail'));
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar las tareas.');
    const button = fixture.nativeElement.querySelector(
      'section[role="alert"] button',
    ) as HTMLButtonElement;
    button.click();
    expect(reloadMine).toHaveBeenCalled();
  });

  it('should open the reassign dialog for a task', () => {
    setup();
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    buttons.find((button) => button.textContent?.includes('Reasignar'))?.click();
    expect(modalOpen).toHaveBeenCalled();
    expect(fixture.componentInstance.selectedTask()?.id).toBe('t-1');
  });
});
