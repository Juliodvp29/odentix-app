import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WritableSignal, signal } from '@angular/core';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { SessionService } from '@core/auth/session.service';
import { ModalService } from '@shared/modal/modal.service';
import { ToastService } from '@shared/toast/toast.service';
import { InvoiceResponse } from '../billing-models';
import { PaymentCreateAction } from './payment-create-action';

function invoice(status: string): InvoiceResponse {
  return {
    id: 'inv-1',
    invoiceNumber: 'FAC-000001',
    status: status as InvoiceResponse['status'],
    totalCop: 520000,
  };
}

describe('PaymentCreateAction', () => {
  let fixture: ComponentFixture<PaymentCreateAction>;
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
      imports: [PaymentCreateAction],
      providers: [
        { provide: ModalService, useValue: { open } },
        { provide: ToastService, useValue: { success } },
        { provide: SessionService, useValue: { currentUser } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PaymentCreateAction);
    fixture.componentRef.setInput('invoice', invoice('pendiente'));
    fixture.detectChanges();
  });

  it('should show the payment action for a pending invoice', () => {
    expect(fixture.nativeElement.textContent).toContain('Registrar pago');
  });

  it('should hide the action for external specialists', () => {
    currentUser.set({ role: 'especialista_externo' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Registrar pago');
  });

  it('should show a final note instead of the action for settled invoices', () => {
    fixture.componentRef.setInput('invoice', invoice('pagada'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('sin pagos pendientes');
    expect(fixture.nativeElement.querySelector('button')).toBeNull();

    fixture.componentRef.setInput('invoice', invoice('anulada'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('no admite pagos');
  });

  it('should open the payment modal', () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(open).toHaveBeenCalledOnce();
  });

  it('should close, toast, and emit after the payment is registered', () => {
    let emittedStatus: string | undefined;
    fixture.componentInstance.paid.subscribe((payment) => {
      emittedStatus = payment.invoiceStatus;
    });
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    fixture.componentInstance.onPaid({ id: 'pay-1', amountCop: 520000, invoiceStatus: 'pagada' });
    expect(close).toHaveBeenCalled();
    expect(success).toHaveBeenCalledWith(expect.stringContaining('520.000'));
    expect(emittedStatus).toBe('pagada');
  });
});
