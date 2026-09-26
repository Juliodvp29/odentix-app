import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WritableSignal, signal } from '@angular/core';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { SessionService } from '@core/auth/session.service';
import type { TreatmentPlanResponse } from '@features/treatment-plans/treatment-plan-models';
import { ModalService } from '@shared/modal/modal.service';
import { ToastService } from '@shared/toast/toast.service';
import { InvoiceCreateAction } from './invoice-create-action';

const PLAN: TreatmentPlanResponse = {
  id: 'plan-1',
  patientId: 'patient-1',
  diagnosis: 'Rehabilitación oral',
  status: 'aceptado',
  totalPriceCop: 380000,
  items: [
    { id: 'item-1', toothNumber: 16, priceCop: 400000, discountCop: 20000, netPriceCop: 380000 },
  ],
};

describe('InvoiceCreateAction', () => {
  let fixture: ComponentFixture<InvoiceCreateAction>;
  let currentUser: WritableSignal<{ role?: string }>;
  let open: ReturnType<typeof vi.fn>;
  let close: ReturnType<typeof vi.fn>;
  let success: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    currentUser = signal({ role: 'recepcion' });
    open = vi.fn(() => ({ close, closed: of(void 0) }));
    close = vi.fn();
    success = vi.fn();
    await TestBed.configureTestingModule({
      imports: [InvoiceCreateAction],
      providers: [
        { provide: ModalService, useValue: { open } },
        { provide: ToastService, useValue: { success } },
        { provide: SessionService, useValue: { currentUser } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(InvoiceCreateAction);
    fixture.componentRef.setInput('plan', PLAN);
    fixture.detectChanges();
  });

  it('should show the invoicing action for an authorized role', () => {
    expect(fixture.nativeElement.textContent).toContain('Generar factura');
  });

  it('should hide the action for external specialists', () => {
    currentUser.set({ role: 'especialista_externo' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Generar factura');
  });

  it('should disable invoicing with a hint when the plan has no items', () => {
    fixture.componentRef.setInput('plan', { ...PLAN, items: [] });
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('El plan no tiene ítems para facturar.');
    button.click();
    expect(open).not.toHaveBeenCalled();
  });

  it('should open the invoice modal', () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(open).toHaveBeenCalledOnce();
  });

  it('should close, toast, and emit after the invoice is created', () => {
    let emittedId: string | undefined;
    fixture.componentInstance.created.subscribe((invoice) => {
      emittedId = invoice.id;
    });
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    fixture.componentInstance.onCreated({ id: 'inv-1', invoiceNumber: 'FAC-000001' });
    expect(close).toHaveBeenCalled();
    expect(success).toHaveBeenCalledWith('Factura FAC-000001 generada.');
    expect(emittedId).toBe('inv-1');
  });
});
