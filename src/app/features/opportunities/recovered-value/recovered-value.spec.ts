import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { RecoveredValue } from './recovered-value';

async function flushEffects(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

const RECOVERED = [
  { type: 'saldo_vencido', totalAmountCop: 150000, count: 2 },
  { type: 'lead_sin_respuesta', totalAmountCop: 300000, count: 1 },
];

describe('RecoveredValue', () => {
  let fixture: ComponentFixture<RecoveredValue>;
  let httpTesting: HttpTestingController;

  const bodyText = (): string => fixture.nativeElement.textContent as string;

  async function flushRecovered(): Promise<void> {
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/opportunities/recovered-value'))
      .flush(RECOVERED);
    await flushEffects();
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RecoveredValue],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(RecoveredValue);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should render totals and categories from the backend', async () => {
    await flushRecovered();
    expect(bodyText()).toContain('Valor recuperado');
    expect(bodyText()).toContain('450.000');
    expect(bodyText()).toContain('3');
    expect(bodyText()).toContain('Saldo vencido');
    expect(bodyText()).toContain('Lead sin respuesta');
    expect(bodyText()).toContain('2 recuperadas');
  });

  it('should request the default range as Bogota day bounds', async () => {
    await flushEffects();
    const call = httpTesting.expectOne((request) =>
      request.url.endsWith('/api/v1/opportunities/recovered-value'),
    );
    expect(call.request.params.get('from')).toMatch(/T00:00:00-05:00$/);
    expect(call.request.params.get('to')).toMatch(/T23:59:59-05:00$/);
    call.flush([]);
    await flushEffects();
  });

  it('should explain plan gating instead of failing', async () => {
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/opportunities/recovered-value'))
      .flush(null, { status: 403, statusText: 'Forbidden' });
    await flushEffects();
    fixture.detectChanges();
    expect(bodyText()).toContain('El valor recuperado no está incluido en tu plan');
  });

  it('should retry when loading fails', async () => {
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/opportunities/recovered-value'))
      .error(new ProgressEvent('error'));
    await flushEffects();
    fixture.detectChanges();
    expect(bodyText()).toContain('No fue posible cargar el valor recuperado.');
    const retry = fixture.nativeElement.querySelector(
      'div[role="alert"] button',
    ) as HTMLButtonElement;
    retry.click();
    await flushEffects();
    httpTesting.expectOne((call) => call.url.endsWith('/api/v1/opportunities/recovered-value'));
  });

  it('should show the empty state without recovered value', async () => {
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/opportunities/recovered-value'))
      .flush([]);
    await flushEffects();
    fixture.detectChanges();
    expect(bodyText()).toContain('Sin valor recuperado en este rango.');
  });

  it('should warn on an invalid range', () => {
    httpTesting.expectOne((call) => call.url.endsWith('/api/v1/opportunities/recovered-value'));
    fixture.componentInstance.model.set({ from: '2026-09-28', to: '2026-09-01' });
    fixture.detectChanges();
    expect(bodyText()).toContain('La fecha inicial no puede ser posterior a la final.');
    expect(fixture.componentInstance.rangeValid()).toBe(false);
  });
});
