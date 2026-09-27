import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WritableSignal, signal } from '@angular/core';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { SessionService } from '@core/auth/session.service';
import type { TreatmentPlanResponse } from '@features/treatment-plans/treatment-plan-models';
import { ModalService } from '@shared/modal/modal.service';
import { ToastService } from '@shared/toast/toast.service';
import { PaymentPlanCreateAction } from './payment-plan-create-action';

const PLAN: TreatmentPlanResponse = {
  id: 'plan-1',
  patientId: 'patient-1',
  diagnosis: 'Rehabilitación oral',
  status: 'aceptado',
  totalPriceCop: 300000,
  items: [],
};

describe('PaymentPlanCreateAction', () => {
  let fixture: ComponentFixture<PaymentPlanCreateAction>;
  let currentUser: WritableSignal<{ role?: string }>;
  let open: ReturnType<typeof vi.fn>;
  let close: ReturnType<typeof vi.fn>;
  let success: ReturnType<typeof vi.fn>;
  let info: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    currentUser = signal({ role: 'recepcion' });
    open = vi.fn(() => ({ close, closed: of(void 0) }));
    close = vi.fn();
    success = vi.fn();
    info = vi.fn();
    await TestBed.configureTestingModule({
      imports: [PaymentPlanCreateAction],
      providers: [
        { provide: ModalService, useValue: { open } },
        { provide: ToastService, useValue: { success, info } },
        { provide: SessionService, useValue: { currentUser } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PaymentPlanCreateAction);
    fixture.componentRef.setInput('treatmentPlan', PLAN);
    fixture.detectChanges();
  });

  it('should show the creation action for an authorized role', () => {
    expect(fixture.nativeElement.textContent).toContain('Crear plan de pago');
  });

  it('should hide the action for external specialists', () => {
    currentUser.set({ role: 'especialista_externo' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Crear plan de pago');
  });

  it('should open the creation modal', () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(open).toHaveBeenCalledOnce();
  });

  it('should close, toast, and emit after creation', () => {
    let emittedId: string | undefined;
    fixture.componentInstance.created.subscribe((plan) => {
      emittedId = plan.id;
    });
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    fixture.componentInstance.onCreated({ id: 'pp-1', installmentsCount: 3 });
    expect(close).toHaveBeenCalled();
    expect(success).toHaveBeenCalledWith('Plan de pago creado (3 cuotas).');
    expect(emittedId).toBe('pp-1');
  });

  it('should inform and emit when the plan already exists', () => {
    let existed = false;
    fixture.componentInstance.alreadyExists.subscribe(() => {
      existed = true;
    });
    fixture.componentInstance.onAlreadyExists();
    expect(info).toHaveBeenCalledWith('El plan ya tiene un plan de pago.');
    expect(existed).toBe(true);
  });
});
