import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { SpecialistCreateForm } from './specialist-create-form';

function submit(fixture: ComponentFixture<SpecialistCreateForm>): void {
  fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
  fixture.detectChanges();
}

describe('SpecialistCreateForm', () => {
  let fixture: ComponentFixture<SpecialistCreateForm>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpecialistCreateForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(SpecialistCreateForm);
    fixture.detectChanges();
    httpTesting = TestBed.inject(HttpTestingController);
    // The form shares the eager directory service: flush its requests.
    await new Promise((resolve) => setTimeout(resolve, 0));
    httpTesting.expectOne((call) => call.url.endsWith('/api/v1/professionals')).flush([]);
    httpTesting.expectOne((call) => call.url.endsWith('/api/v1/rooms')).flush([]);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should require a name and fee before posting', () => {
    submit(fixture);
    httpTesting.expectNone((call) => call.method === 'POST');
    expect(fixture.nativeElement.textContent).toContain('El nombre es obligatorio.');
  });

  it('should create the professional and then the profile on success', async () => {
    let createdId: string | undefined;
    fixture.componentInstance.created.subscribe((profile) => {
      createdId = profile.id;
    });
    fixture.componentInstance.model.set({
      fullName: 'Dra. Ana Ruiz',
      specialty: 'Endodoncia',
      licenseNumber: '',
      feePercentage: 30,
      paymentTerms: 'Neto 15 días',
    });
    fixture.detectChanges();
    submit(fixture);

    const professionalRequest = httpTesting.expectOne((call) =>
      call.url.endsWith('/api/v1/professionals'),
    );
    expect(professionalRequest.request.method).toBe('POST');
    expect(professionalRequest.request.body).toEqual({
      fullName: 'Dra. Ana Ruiz',
      specialty: 'Endodoncia',
      licenseNumber: undefined,
      isExternal: true,
    });
    professionalRequest.flush({ id: 'prof-9', fullName: 'Dra. Ana Ruiz' });
    await fixture.whenStable();
    fixture.detectChanges();

    const profileRequest = httpTesting.expectOne((call) =>
      call.url.endsWith('/api/v1/specialists'),
    );
    expect(profileRequest.request.body).toEqual({
      professionalId: 'prof-9',
      feePercentage: 30,
      paymentTerms: 'Neto 15 días',
    });
    profileRequest.flush({ id: 'spec-9', professionalId: 'prof-9' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(createdId).toBe('spec-9');
  });

  it('should report a partial failure when the profile step fails', async () => {
    fixture.componentInstance.model.set({
      fullName: 'Dra. Ana Ruiz',
      specialty: '',
      licenseNumber: '',
      feePercentage: 30,
      paymentTerms: '',
    });
    fixture.detectChanges();
    submit(fixture);

    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/professionals'))
      .flush({ id: 'prof-9' });
    await fixture.whenStable();
    fixture.detectChanges();

    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/specialists'))
      .flush({ message: 'Ya tiene ficha' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('El profesional se creó');
    expect(fixture.nativeElement.textContent).toContain('Ya tiene ficha');
  });
});
