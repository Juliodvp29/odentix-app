import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PatientResponse, PatientsService } from '@features/patients/patients.service';
import { PatientForm } from './patient-form';

describe('PatientForm', () => {
  let fixture: ComponentFixture<PatientForm>;
  let create: ReturnType<typeof vi.fn>;
  let update: ReturnType<typeof vi.fn>;

  const firstNameInput = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('input[placeholder="María"]') as HTMLInputElement;

  function fillNames(): void {
    firstNameInput().value = 'Ada';
    firstNameInput().dispatchEvent(new Event('input', { bubbles: true }));
    const lastName = fixture.nativeElement.querySelector(
      'input[placeholder="García"]',
    ) as HTMLInputElement;
    lastName.value = 'Luz';
    lastName.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  function submitForm(): void {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    create = vi.fn(() => of({ id: 'patient-1' }));
    update = vi.fn(() => of({ id: 'patient-1' }));
    await TestBed.configureTestingModule({
      imports: [PatientForm],
      providers: [{ provide: PatientsService, useValue: { create, update } }],
    }).compileComponents();
    fixture = TestBed.createComponent(PatientForm);
    fixture.detectChanges();
  });

  it('should render all fields', () => {
    expect(fixture.nativeElement.textContent).toContain('Nombres');
    expect(fixture.nativeElement.textContent).toContain('Tipo de documento');
    expect(fixture.nativeElement.textContent).toContain('Contacto de emergencia');
  });

  it('should show field errors without submitting on invalid data', () => {
    submitForm();
    expect(fixture.nativeElement.textContent).toContain('El nombre es obligatorio');
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('should create with a stripped payload and emit saved', async () => {
    let saved = 0;
    fixture.componentInstance.saved.subscribe(() => saved++);
    fillNames();
    submitForm();
    expect(create).toHaveBeenCalledWith({ firstName: 'Ada', lastName: 'Luz' });
    await fixture.whenStable();
    expect(saved).toBe(1);
  });

  it('should prefill and update in edit mode', async () => {
    const patient = {
      id: 'patient-1',
      firstName: 'Ada',
      lastName: 'Luz',
      phone: '3104567890',
    } as PatientResponse;
    let saved = 0;
    fixture.componentInstance.saved.subscribe(() => saved++);
    fixture.componentRef.setInput('patient', patient);
    fixture.detectChanges();
    expect(firstNameInput().value).toBe('Ada');
    submitForm();
    await fixture.whenStable();
    expect(update).toHaveBeenCalledWith(
      'patient-1',
      expect.objectContaining({ firstName: 'Ada', phone: '3104567890' }),
    );
    expect(create).not.toHaveBeenCalled();
    expect(saved).toBe(1);
  });

  it('should keep the modal open showing the server error on failure', async () => {
    let saved = 0;
    fixture.componentInstance.saved.subscribe(() => saved++);
    create.mockReturnValue(throwError(() => new Error('duplicate')));
    fillNames();
    submitForm();
    await fixture.whenStable();
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alert?.textContent?.trim()).toBe('No pudimos guardar el paciente. Intenta de nuevo.');
    expect(saved).toBe(0);
  });
});
