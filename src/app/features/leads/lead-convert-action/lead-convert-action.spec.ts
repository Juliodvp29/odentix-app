import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ModalService } from '@shared/modal/modal.service';
import { ToastService } from '@shared/toast/toast.service';
import { ConvertLeadResponse, LeadResponse } from '../lead-models';
import { LeadConvertAction } from './lead-convert-action';

const LEAD: LeadResponse = {
  id: 'lead-1',
  fullName: 'Ana Torres',
  status: 'calificado',
};

describe('LeadConvertAction', () => {
  let fixture: ComponentFixture<LeadConvertAction>;
  let open: ReturnType<typeof vi.fn>;
  let close: ReturnType<typeof vi.fn>;
  let success: ReturnType<typeof vi.fn>;
  let info: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    open = vi.fn(() => ({ close, closed: of(void 0) }));
    close = vi.fn();
    success = vi.fn();
    info = vi.fn();
    await TestBed.configureTestingModule({
      imports: [LeadConvertAction],
      providers: [
        { provide: ModalService, useValue: { open } },
        { provide: ToastService, useValue: { success, info } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LeadConvertAction);
    fixture.componentRef.setInput('lead', LEAD);
    fixture.detectChanges();
  });

  it('should show the conversion action for a pending lead', () => {
    expect(fixture.nativeElement.textContent).toContain('Convertir en paciente');
  });

  it('should hide the action for an already converted lead', () => {
    fixture.componentRef.setInput('lead', { ...LEAD, convertedPatientId: 'patient-9' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Convertir en paciente');
  });

  it('should open the conversion modal', () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(open).toHaveBeenCalledOnce();
  });

  it('should close, toast, and emit after conversion', () => {
    let emittedId: string | undefined;
    fixture.componentInstance.converted.subscribe((response) => {
      emittedId = response.patientId;
    });
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    const response: ConvertLeadResponse = {
      leadId: 'lead-1',
      patientId: 'patient-9',
      alreadyConverted: false,
      patient: { id: 'patient-9', firstName: 'Ana' },
    };
    fixture.componentInstance.onConverted(response);
    expect(close).toHaveBeenCalled();
    expect(success).toHaveBeenCalledWith('Ana ahora es paciente.');
    expect(emittedId).toBe('patient-9');
  });

  it('should inform when the lead was already converted', () => {
    fixture.componentInstance.onConverted({
      leadId: 'lead-1',
      patientId: 'patient-9',
      alreadyConverted: true,
    });
    expect(info).toHaveBeenCalledWith('El prospecto ya estaba convertido.');
  });
});
