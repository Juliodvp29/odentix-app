import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { WaitlistService } from '../waitlist.service';
import { WaitlistConvertDialog } from './waitlist-convert-dialog';

const ENTRY = {
  id: 'entry-1',
  patientId: 'patient-1',
  patientName: 'Ana Torres',
  status: 'activa' as const,
};

describe('WaitlistConvertDialog', () => {
  let fixture: ComponentFixture<WaitlistConvertDialog>;
  let convert: ReturnType<typeof vi.fn>;

  function clickConfirm(): void {
    const button = Array.from(fixture.nativeElement.querySelectorAll('button')).find((element) =>
      (element as HTMLButtonElement).textContent?.includes('Convertir en cita'),
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    convert = vi.fn(() => of({ id: 'appointment-2', patientId: 'patient-1' }));
    await TestBed.configureTestingModule({
      imports: [WaitlistConvertDialog],
      providers: [{ provide: WaitlistService, useValue: { convert } }],
    }).compileComponents();
    fixture = TestBed.createComponent(WaitlistConvertDialog);
    fixture.componentRef.setInput('entry', ENTRY);
    fixture.componentRef.setInput('sourceAppointmentId', 'appointment-1');
    fixture.componentRef.setInput('sourceStartsAt', '2026-09-22T14:00:00Z');
    fixture.componentRef.setInput('sourceEndsAt', '2026-09-22T15:00:00Z');
    fixture.detectChanges();
  });

  it('should identify the patient and source schedule', () => {
    expect(fixture.nativeElement.textContent).toContain('Ana Torres');
    expect(fixture.nativeElement.textContent).toContain('22/09/2026');
    expect(fixture.nativeElement.textContent).not.toContain('appointment-1');
  });

  it('should post the conversion request and emit the appointment', async () => {
    let appointmentId: string | undefined;
    fixture.componentInstance.converted.subscribe(
      (appointment) => (appointmentId = appointment.id),
    );
    const notes = fixture.nativeElement.querySelector(
      'input[placeholder="Motivo de la conversión"]',
    ) as HTMLInputElement;
    notes.value = 'Cita recuperada';
    notes.dispatchEvent(new Event('input', { bubbles: true }));
    clickConfirm();
    await fixture.whenStable();

    expect(convert).toHaveBeenCalledWith('entry-1', {
      sourceAppointmentId: 'appointment-1',
      notes: 'Cita recuperada',
    });
    expect(appointmentId).toBe('appointment-2');
  });

  it('should keep the dialog open and show a conflict error', async () => {
    convert.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { message: 'El horario ya está ocupado' },
          }),
      ),
    );
    clickConfirm();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('El horario ya está ocupado');
    expect(fixture.componentInstance.saving()).toBe(false);
  });
});
