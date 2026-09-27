import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { SettlementGenerateForm } from './settlement-generate-form';

function submit(fixture: ComponentFixture<SettlementGenerateForm>): void {
  fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
  fixture.detectChanges();
}

describe('SettlementGenerateForm', () => {
  let fixture: ComponentFixture<SettlementGenerateForm>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettlementGenerateForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(SettlementGenerateForm);
    fixture.componentRef.setInput('specialistId', 'spec-1');
    fixture.detectChanges();
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should require both period bounds before posting', () => {
    submit(fixture);
    httpTesting.expectNone((call) => call.url.includes('/settlements'));
    expect(fixture.nativeElement.textContent).toContain('El inicio del periodo es obligatorio.');
  });

  it('should block an inverted period without posting', () => {
    fixture.componentInstance.model.set({ periodStart: '2026-09-30', periodEnd: '2026-09-01' });
    fixture.detectChanges();
    submit(fixture);
    httpTesting.expectNone((call) => call.url.includes('/settlements'));
    expect(fixture.nativeElement.textContent).toContain(
      'El fin del periodo no puede ser anterior al inicio.',
    );
  });

  it('should POST the settlement and emit it on success', async () => {
    let generatedId: string | undefined;
    fixture.componentInstance.generated.subscribe((settlement) => {
      generatedId = settlement.id;
    });
    fixture.componentInstance.model.set({ periodStart: '2026-09-01', periodEnd: '2026-09-30' });
    fixture.detectChanges();
    submit(fixture);
    const request = httpTesting.expectOne((call) =>
      call.url.endsWith('/api/v1/specialists/spec-1/settlements'),
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ periodStart: '2026-09-01', periodEnd: '2026-09-30' });
    request.flush({ id: 'set-1', status: 'pendiente', feeAmountCop: 300000 });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(generatedId).toBe('set-1');
  });

  it('should emit alreadyExists when the period was settled before', async () => {
    let conflicted = false;
    fixture.componentInstance.alreadyExists.subscribe(() => {
      conflicted = true;
    });
    fixture.componentInstance.model.set({ periodStart: '2026-09-01', periodEnd: '2026-09-30' });
    fixture.detectChanges();
    submit(fixture);
    const request = httpTesting.expectOne((call) => call.url.endsWith('/settlements'));
    request.flush({ message: 'Ya existe' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(conflicted).toBe(true);
  });
});
