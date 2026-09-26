import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { LeadActivityForm } from './lead-activity-form';

function submit(fixture: ComponentFixture<LeadActivityForm>): void {
  fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
  fixture.detectChanges();
}

describe('LeadActivityForm', () => {
  let fixture: ComponentFixture<LeadActivityForm>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadActivityForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(LeadActivityForm);
    fixture.componentRef.setInput('leadId', 'lead-1');
    fixture.detectChanges();
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should require a contact type before posting', () => {
    submit(fixture);
    httpTesting.expectNone((call) => call.url.includes('/activities'));
    expect(fixture.nativeElement.textContent).toContain('El tipo de contacto es obligatorio.');
  });

  it('should POST the activity and emit it on success', async () => {
    let loggedId: string | undefined;
    fixture.componentInstance.logged.subscribe((activity) => {
      loggedId = activity.id;
    });
    fixture.componentInstance.model.update((model) => ({
      ...model,
      activityType: 'whatsapp',
      notes: 'Pidió cotización',
    }));
    fixture.detectChanges();
    submit(fixture);
    const request = httpTesting.expectOne((call) =>
      call.url.endsWith('/api/v1/leads/lead-1/activities'),
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ activityType: 'whatsapp', notes: 'Pidió cotización' });
    request.flush({ id: 'act-1', leadId: 'lead-1', activityType: 'whatsapp' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(loggedId).toBe('act-1');
  });

  it('should omit blank notes from the request', async () => {
    fixture.componentInstance.model.update((model) => ({ ...model, activityType: 'nota' }));
    fixture.detectChanges();
    submit(fixture);
    const request = httpTesting.expectOne((call) => call.url.endsWith('/activities'));
    expect(request.request.body).toEqual({ activityType: 'nota' });
    request.flush({ id: 'act-2', leadId: 'lead-1', activityType: 'nota' });
    await fixture.whenStable();
  });

  it('should surface the backend message when logging fails', async () => {
    fixture.componentInstance.model.update((model) => ({ ...model, activityType: 'llamada' }));
    fixture.detectChanges();
    submit(fixture);
    const request = httpTesting.expectOne((call) => call.url.endsWith('/activities'));
    request.flush(
      { message: 'Lead no encontrado.' },
      { status: 404, statusText: 'Not Found' },
    );
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Lead no encontrado.');
  });
});
