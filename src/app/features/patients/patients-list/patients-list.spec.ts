import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PatientsListPage } from './patients-list';

async function flushEffects(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
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
      .flush({ content: [{ firstName: 'Ada', lastName: 'Luz', documentNumber: '123' }] });
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
});
