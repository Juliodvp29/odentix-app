import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WritableSignal, signal } from '@angular/core';
import { of } from 'rxjs';
import { AppointmentResponse } from '../../appointments.service';
import { SessionService } from '@core/auth/session.service';
import { ModalService } from '@shared/modal/modal.service';
import { ToastService } from '@shared/toast/toast.service';
import { WaitlistEntryAction } from './waitlist-entry-action';

const APPOINTMENT: AppointmentResponse = {
  id: 'appointment-1',
  patientId: 'patient-1',
  patientName: 'Ada Luz',
  status: 'programada',
};

describe('WaitlistEntryAction', () => {
  let fixture: ComponentFixture<WaitlistEntryAction>;
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
      imports: [WaitlistEntryAction],
      providers: [
        { provide: ModalService, useValue: { open } },
        { provide: ToastService, useValue: { success } },
        { provide: SessionService, useValue: { currentUser } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(WaitlistEntryAction);
    fixture.componentRef.setInput('appointment', APPOINTMENT);
    fixture.detectChanges();
  });

  it('should show the registration action for an authorized role', () => {
    expect(fixture.nativeElement.textContent).toContain('Añadir a lista de espera');
  });

  it('should hide the action for external specialists', () => {
    currentUser.set({ role: 'especialista_externo' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Añadir a lista de espera');
  });

  it('should open the waitlist modal', () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(open).toHaveBeenCalledOnce();
  });

  it('should close and show a success toast after saving', () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    fixture.componentInstance.onSaved();
    expect(close).toHaveBeenCalled();
    expect(success).toHaveBeenCalledWith('Paciente añadido a la lista de espera.');
  });
});
