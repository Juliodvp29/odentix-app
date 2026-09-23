import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PatientResponse, PatientsService } from '@features/patients/patients.service';
import { WaitlistService } from '../waitlist.service';
import { WaitlistCreateDialog } from './waitlist-create-dialog';

const PATIENT: PatientResponse = {
  id: 'patient-1',
  firstName: 'Ana',
  lastName: 'Torres',
  phone: '3001234567',
};

describe('WaitlistCreateDialog', () => {
  let fixture: ComponentFixture<WaitlistCreateDialog>;
  let addEntry: ReturnType<typeof vi.fn>;
  let searchPatients: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    addEntry = vi.fn(() => of({ id: 'entry-1' }));
    searchPatients = vi.fn(() => of([PATIENT]));
    await TestBed.configureTestingModule({
      imports: [WaitlistCreateDialog],
      providers: [
        { provide: WaitlistService, useValue: { addEntry } },
        { provide: PatientsService, useValue: { searchPatients } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(WaitlistCreateDialog);
    fixture.detectChanges();
  });

  it('should start with a patient picker', () => {
    expect(fixture.nativeElement.textContent).toContain('Buscar paciente');
    expect(fixture.nativeElement.textContent).toContain('Selecciona un paciente');
  });

  it('should pass generic patient data to the entry form', () => {
    fixture.componentInstance.selectPatient(PATIENT);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ana Torres');
    expect(fixture.nativeElement.textContent).toContain('Guardar en lista de espera');
  });

  it('should emit saved after creating an entry', async () => {
    let saved = false;
    fixture.componentInstance.saved.subscribe(() => (saved = true));
    fixture.componentInstance.selectPatient(PATIENT);
    fixture.detectChanges();
    const save = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Guardar en lista de espera'),
    ) as HTMLButtonElement;
    save.click();
    await fixture.whenStable();

    expect(addEntry).toHaveBeenCalledWith({
      patientId: 'patient-1',
      procedureId: undefined,
      desiredFrom: undefined,
      desiredTo: undefined,
    });
    expect(saved).toBe(true);
  });

  it('should let the user change the selected patient', () => {
    fixture.componentInstance.selectPatient(PATIENT);
    fixture.detectChanges();
    const change = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Cambiar'),
    ) as HTMLButtonElement;
    change.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Buscar paciente');
  });
});
