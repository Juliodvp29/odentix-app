import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastService } from '@shared/toast/toast.service';
import { PatientsListPage } from './patients-list';

async function flushEffects(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function settleModal(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 250));
}

describe('PatientsListPage', () => {
  let fixture: ComponentFixture<PatientsListPage>;
  let httpTesting: HttpTestingController;

  const bodyText = (): string => fixture.nativeElement.textContent as string;

  async function searchFor(value: string): Promise<void> {
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 350));
    fixture.detectChanges();
  }

  async function flushPatients(): Promise<void> {
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients'))
      .flush({
        content: [{ id: 'patient-1', firstName: 'Ada', lastName: 'Luz', documentNumber: '123' }],
      });
    await flushEffects();
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PatientsListPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(PatientsListPage);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
    document.querySelectorAll('.cdk-overlay-container').forEach((element) => element.remove());
  });

  it('should render patients from the backend', async () => {
    await flushPatients();
    expect(bodyText()).toContain('Pacientes');
    expect(bodyText()).toContain('Ada Luz');
    expect(bodyText()).toContain('123');
  });

  it('should search without reloading and show skeletons while loading', async () => {
    await flushPatients();
    const searching = searchFor('lui');
    await searching;
    const pending = httpTesting.expectOne((call) => call.url.endsWith('/api/v1/patients'));
    expect(pending.request.params.get('query')).toBe('lui');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
    pending.flush({ content: [], totalElements: 0 });
    await flushEffects();
    fixture.detectChanges();
    expect(bodyText()).toContain('No hay pacientes para mostrar');
  });

  it('should open the create form in a modal', async () => {
    await flushPatients();
    const create = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Nuevo paciente'),
    ) as HTMLButtonElement;
    create.click();
    fixture.detectChanges();
    await flushEffects();
    const dialog = document.querySelector('.cdk-overlay-pane') as HTMLElement;
    expect(dialog.textContent).toContain('Nuevo paciente');
    expect(dialog.textContent).toContain('Nombres');
  });

  it('should create a patient, close the modal, and refresh the list', async () => {
    await flushPatients();
    const notifications = TestBed.inject(ToastService);
    const create = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Nuevo paciente'),
    ) as HTMLButtonElement;
    create.click();
    fixture.detectChanges();
    await flushEffects();
    const firstName = document.querySelector('input[placeholder="María"]') as HTMLInputElement;
    firstName.value = 'Ada';
    firstName.dispatchEvent(new Event('input', { bubbles: true }));
    const lastName = document.querySelector('input[placeholder="García"]') as HTMLInputElement;
    lastName.value = 'Luz';
    lastName.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    (document.querySelector('.cdk-overlay-pane form') as HTMLFormElement).dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    const post = httpTesting.expectOne((call) => call.url.endsWith('/api/v1/patients'));
    expect(post.request.method).toBe('POST');
    post.flush({ id: 'patient-9' });
    await settleModal();
    fixture.detectChanges();
    expect(document.querySelector('.cdk-overlay-pane')).toBeNull();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients'))
      .flush({ content: [{ firstName: 'Ada', lastName: 'Luz' }], totalElements: 1 });
    await flushEffects();
    fixture.detectChanges();
    expect(bodyText()).toContain('Ada Luz');
    expect(notifications.toasts().map((toast) => toast.message)).toContain('Paciente creado');
  });

  it('should edit a patient through its row action', async () => {
    await flushPatients();
    const edit = fixture.nativeElement.querySelector(
      '[aria-label="Editar paciente"]',
    ) as HTMLButtonElement;
    edit.click();
    fixture.detectChanges();
    await flushEffects();
    const dialog = document.querySelector('.cdk-overlay-pane') as HTMLElement;
    expect(dialog.textContent).toContain('Editar paciente');
    (document.querySelector('.cdk-overlay-pane form') as HTMLFormElement).dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    const patch = httpTesting.expectOne((call) => call.url.includes('/api/v1/patients/'));
    expect(patch.request.method).toBe('PATCH');
    patch.flush({});
    await settleModal();
    fixture.detectChanges();
    expect(document.querySelector('.cdk-overlay-pane')).toBeNull();
    httpTesting.expectOne((call) => call.url.endsWith('/api/v1/patients')).flush({ content: [] });
    await flushEffects();
  });
});
