import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ConvertLeadResponse, LeadResponse } from '../lead-models';
import { LeadConvertForm } from './lead-convert-form';

const LEAD: LeadResponse = {
  id: 'lead-1',
  fullName: 'Ana Torres',
  phone: '3001112233',
  email: 'ana@example.com',
  status: 'calificado',
};

function submit(fixture: ComponentFixture<LeadConvertForm>): void {
  fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
  fixture.detectChanges();
}

describe('LeadConvertForm', () => {
  let fixture: ComponentFixture<LeadConvertForm>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadConvertForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(LeadConvertForm);
    fixture.componentRef.setInput('lead', LEAD);
    fixture.detectChanges();
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should prefill names, phone, and email from the lead', () => {
    expect(fixture.componentInstance.model().firstName).toBe('Ana');
    expect(fixture.componentInstance.model().lastName).toBe('Torres');
    expect(fixture.componentInstance.model().phone).toBe('3001112233');
    expect(fixture.componentInstance.model().email).toBe('ana@example.com');
  });

  it('should POST the conversion and emit the response on success', async () => {
    let convertedId: string | undefined;
    fixture.componentInstance.converted.subscribe((response) => {
      convertedId = response.patientId;
    });
    submit(fixture);
    const request = httpTesting.expectOne((call) =>
      call.url.endsWith('/api/v1/leads/lead-1/convert'),
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      patient: {
        firstName: 'Ana',
        lastName: 'Torres',
        documentType: undefined,
        documentNumber: undefined,
        birthDate: undefined,
        phone: '3001112233',
        email: 'ana@example.com',
        address: undefined,
        emergencyContactName: undefined,
        emergencyContactPhone: undefined,
      },
    });
    const response: ConvertLeadResponse = {
      leadId: 'lead-1',
      patientId: 'patient-9',
      alreadyConverted: false,
    };
    request.flush(response);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(convertedId).toBe('patient-9');
  });

  it('should require names before posting', () => {
    fixture.componentInstance.model.update((model) => ({ ...model, firstName: '', lastName: '' }));
    fixture.detectChanges();
    submit(fixture);
    httpTesting.expectNone((call) => call.url.includes('/convert'));
    expect(fixture.nativeElement.textContent).toContain('El nombre es obligatorio');
  });

  it('should surface the backend message when conversion fails', async () => {
    submit(fixture);
    const request = httpTesting.expectOne((call) => call.url.endsWith('/convert'));
    request.flush(
      { message: 'Lead no encontrado con id.' },
      { status: 404, statusText: 'Not Found' },
    );
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Lead no encontrado con id.');
  });
});
