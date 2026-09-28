import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { TaskReassignForm } from './task-reassign-form';
import { TaskResponse, TenantMember } from '../task-models';
import { TasksService } from '../tasks.service';

const TASK: TaskResponse = {
  id: 't-1',
  title: 'Confirmar cita de ortodoncia',
  status: 'pendiente',
  assignedTo: 'user-1',
};

const MEMBERS: TenantMember[] = [
  { id: 'user-1', fullName: 'Ana Torres', role: 'recepcion' },
  { id: 'user-2', fullName: 'Carlos Pérez', role: 'odontologo' },
];

describe('TaskReassignForm', () => {
  let fixture: ComponentFixture<TaskReassignForm>;
  let reassignTask: ReturnType<typeof vi.fn>;
  let reassigned: TaskResponse | undefined;

  function setup() {
    reassignTask = vi.fn().mockReturnValue(of({ ...TASK, assignedTo: 'user-2' }));
    reassigned = undefined;

    TestBed.configureTestingModule({
      imports: [TaskReassignForm],
      providers: [{ provide: TasksService, useValue: { reassignTask } }],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskReassignForm);
    fixture.componentRef.setInput('task', TASK);
    fixture.componentRef.setInput('members', MEMBERS);
    fixture.componentInstance.reassigned.subscribe((task) => {
      reassigned = task;
    });
    fixture.detectChanges();
  }

  it('should reassign the task to the chosen member', async () => {
    setup();
    fixture.componentInstance.model.set({ assignedTo: 'user-2' });
    fixture.componentInstance.submitReassign();

    await fixture.whenStable();
    expect(reassignTask).toHaveBeenCalledWith('t-1', 'user-2');
    expect(reassigned?.assignedTo).toBe('user-2');
  });

  it('should require a responsible member before saving', async () => {
    setup();
    fixture.componentInstance.submitReassign();

    await fixture.whenStable();
    expect(reassignTask).not.toHaveBeenCalled();
    expect(reassigned).toBeUndefined();
  });

  it('should cancel without saving', () => {
    setup();
    let cancelled = false;
    fixture.componentInstance.cancelled.subscribe(() => {
      cancelled = true;
    });
    fixture.componentInstance.cancel();
    expect(cancelled).toBe(true);
    expect(reassignTask).not.toHaveBeenCalled();
  });
});
