import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { PatientResponse, PatientsService } from '@features/patients/patients.service';
import { WaitlistPatientPicker } from './waitlist-patient-picker';

const PATIENT: PatientResponse = {
  id: 'patient-1',
  firstName: 'Ada',
  lastName: 'Luz',
  phone: '3001234567',
};

async function waitForDebounce(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));
}

describe('WaitlistPatientPicker', () => {
  let fixture: ComponentFixture<WaitlistPatientPicker>;
  let searchPatients: ReturnType<typeof vi.fn>;

  function type(value: string): void {
    const input = fixture.nativeElement.querySelector(
      '#waitlist-patient-search',
    ) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    searchPatients = vi.fn(() => of([PATIENT]));
    await TestBed.configureTestingModule({
      imports: [WaitlistPatientPicker],
      providers: [{ provide: PatientsService, useValue: { searchPatients } }],
    }).compileComponents();
    fixture = TestBed.createComponent(WaitlistPatientPicker);
    fixture.detectChanges();
  });

  it('should wait for the debounce period before starting a request', () => {
    type('ada');
    expect(searchPatients).not.toHaveBeenCalled();
  });

  it('should show a loading state while searching', async () => {
    const response = new Subject<PatientResponse[]>();
    searchPatients.mockReturnValue(response);
    type('ada');
    await waitForDebounce();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[aria-busy="true"]')).toBeTruthy();
    response.next([PATIENT]);
    response.complete();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ada Luz');
  });

  it('should emit the selected patient', async () => {
    let selected: PatientResponse | undefined;
    fixture.componentInstance.selected.subscribe((patient) => (selected = patient));
    type('ada');
    await waitForDebounce();
    fixture.detectChanges();

    const option = fixture.nativeElement.querySelector('ul button') as HTMLButtonElement;
    option.click();
    expect(selected).toEqual(PATIENT);
  });

  it('should show an empty state for no matches', async () => {
    searchPatients.mockReturnValue(of([]));
    type('zzz');
    await waitForDebounce();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No encontramos pacientes');
  });

  it('should show an error and allow retrying', async () => {
    searchPatients
      .mockReturnValueOnce(throwError(() => new Error('offline')))
      .mockReturnValueOnce(of([PATIENT]));
    type('ada');
    await waitForDebounce();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();

    const retry = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    retry.click();
    await waitForDebounce();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ada Luz');
  });
});
