import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import {
  LeadConversionMetricsResponse,
  LeadResponseTimeMetricsResponse,
} from '../lead-models';
import { LeadsService } from '../leads.service';
import { LeadMetrics } from './lead-metrics';

const CONVERSION: LeadConversionMetricsResponse = {
  totalLeads: 14,
  convertedLeads: 3,
  conversionRatePercentage: 21.4,
  bySource: [
    { dimensionValue: 'instagram', totalLeads: 5, convertedLeads: 2, conversionRatePercentage: 40 },
    { dimensionValue: 'referido', totalLeads: 4, convertedLeads: 1, conversionRatePercentage: 25 },
  ],
  byCampaign: [],
};

const RESPONSE_TIME: LeadResponseTimeMetricsResponse = {
  totalLeads: 14,
  respondedLeads: 10,
  unrespondedLeads: 4,
  responseRatePercentage: 71.4,
  averageResponseTimeMinutes: 95,
  averageResponseTimeHours: 1.58,
};

describe('LeadMetrics', () => {
  let fixture: ComponentFixture<LeadMetrics>;
  let reloadConversion: ReturnType<typeof vi.fn>;
  let reloadResponse: ReturnType<typeof vi.fn>;

  function setup(
    conversion: LeadConversionMetricsResponse | null = CONVERSION,
    response: LeadResponseTimeMetricsResponse | null = RESPONSE_TIME,
    loading = false,
    error: unknown = undefined,
  ) {
    const mockConversion = {
      value: signal(conversion),
      isLoading: signal(loading),
      error: signal(error),
      reload: vi.fn(),
    };
    const mockResponse = {
      value: signal(response),
      isLoading: signal(loading),
      error: signal(error),
      reload: vi.fn(),
    };
    reloadConversion = mockConversion.reload;
    reloadResponse = mockResponse.reload;

    TestBed.configureTestingModule({
      imports: [LeadMetrics],
      providers: [
        provideRouter([]),
        {
          provide: LeadsService,
          useValue: {
            conversionMetrics: () => mockConversion,
            responseTimeMetrics: () => mockResponse,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LeadMetrics);
    fixture.detectChanges();
  }

  it('should render the five indicators with backend values', () => {
    setup();
    const values = Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid="stat-value"]'),
    ).map((element) => (element as HTMLElement).textContent?.trim());
    expect(values).toHaveLength(5);
    expect(values[0]).toBe('14');
    expect(values[1]).toBe('3');
    expect(values[2]).toContain('21,4');
    expect(values[3]).toContain('71,4');
    expect(values[4]).toBe('1 h 35 min');
  });

  it('should render conversion bars by source and campaign', () => {
    setup();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Conversión por origen');
    expect(text).toContain('Conversión por campaña');
    expect(text).toContain('instagram');
    expect(text).toContain('2 de 5');
    expect(text).toContain('Sin datos para este rango.');
  });

  it('should default to the last 30 days', () => {
    setup();
    const range = fixture.componentInstance.model();
    expect(range.from <= range.to).toBe(true);
    expect(fixture.componentInstance.rangeValid()).toBe(true);
  });

  it('should warn without requesting when the range is inverted', () => {
    setup();
    fixture.componentInstance.model.set({ from: '2026-09-26', to: '2026-09-01' });
    fixture.detectChanges();
    expect(fixture.componentInstance.rangeValid()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain(
      'La fecha inicial no puede ser posterior a la final.',
    );
    expect(fixture.componentInstance.fromInstant()).toBe('');
  });

  it('should render skeletons while loading', () => {
    setup(null, null, true);
    const loading = fixture.nativeElement.querySelector('[data-testid="metrics-loading"]');
    expect(loading).not.toBeNull();
    expect(loading.getAttribute('aria-busy')).toBe('true');
  });

  it('should explain plan gating instead of showing broken metrics', () => {
    setup(null, null, false, new HttpErrorResponse({ status: 403 }));
    expect(fixture.nativeElement.textContent).toContain(
      'Las métricas no están incluidas en tu plan',
    );
  });

  it('should show an error with retry on other failures', () => {
    setup(null, null, false, new Error('fail'));
    expect(fixture.nativeElement.textContent).toContain('No fue posible cargar las métricas.');
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(reloadConversion).toHaveBeenCalled();
    expect(reloadResponse).toHaveBeenCalled();
  });
});
