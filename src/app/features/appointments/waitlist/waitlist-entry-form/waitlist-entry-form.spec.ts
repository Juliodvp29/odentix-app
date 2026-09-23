import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AppointmentResponse } from '../../appointments.service';
import { WaitlistService } from '../waitlist.service';
import { WaitlistEntryForm } from './waitlist-entry-form';

const APPOINTMENT: AppointmentResponse = {
  id: 'appointment-1',
  patientId: 'patient-1',
  patientName: 'Ada Luz',
  startsAt: '2026-09-22T14:00:00Z',
  endsAt: '2026-09-22T14:30:00Z',
  status: 'programada',
};

describe('WaitlistEntryForm', () => {
  let fixture: ComponentFixture<WaitlistEntryForm>;
  let addEntry: ReturnType<typeof vi.fn>;

  function dateInputs(): HTMLInputElement[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('input[type="datetime-local"]'),
    ) as HTMLInputElement[];
  }

  function setInput(input: HTMLInputElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  function clickButton(label: string): void {
    const button = Array.from(fixture.nativeElement.querySelectorAll('button')).find((element) =>
      (element as HTMLButtonElement).textContent?.includes(label),
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    addEntry = vi.fn(() => of({ id: 'entry-1' }));
    await TestBed.configureTestingModule({
      imports: [WaitlistEntryForm],
      providers: [{ provide: WaitlistService, useValue: { addEntry } }],
    }).compileComponents();
    fixture = TestBed.createComponent(WaitlistEntryForm);
    fixture.componentRef.setInput('appointment', APPOINTMENT);
    fixture.detectChanges();
  });

  it('should prefill the patient and appointment window', () => {
    expect(fixture.nativeElement.textContent).toContain('Ada Luz');
    expect(dateInputs().map((input) => input.value)).toEqual([
      '2026-09-22T09:00',
      '2026-09-22T09:30',
    ]);
  });

  it('should register the entry and emit saved', async () => {
    let saved = false;
    fixture.componentInstance.saved.subscribe(() => (saved = true));
    clickButton('Guardar en lista de espera');
    await fixture.whenStable();

    expect(addEntry).toHaveBeenCalledWith({
      patientId: 'patient-1',
      desiredFrom: '2026-09-22T09:00:00-05:00',
      desiredTo: '2026-09-22T09:30:00-05:00',
    });
    expect(saved).toBe(true);
  });

  it('should reject an invalid range without posting', () => {
    const inputs = dateInputs();
    setInput(inputs[0]!, '2026-09-22T10:00');
    setInput(inputs[1]!, '2026-09-22T09:30');
    clickButton('Guardar en lista de espera');

    expect(addEntry).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('posterior a la inicial');
  });

  it('should keep the form open and show a backend error', async () => {
    addEntry.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 403,
            error: { message: 'No autorizado' },
          }),
      ),
    );
    clickButton('Guardar en lista de espera');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No tienes permiso');
  });

  it('should emit cancelled without registering', () => {
    let cancelled = false;
    fixture.componentInstance.cancelled.subscribe(() => (cancelled = true));
    clickButton('Cancelar');

    expect(cancelled).toBe(true);
    expect(addEntry).not.toHaveBeenCalled();
  });
});
