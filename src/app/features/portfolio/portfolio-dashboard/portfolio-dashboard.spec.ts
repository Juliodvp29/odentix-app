import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { PortfolioSummaryResponse } from '../portfolio-models';
import { PortfolioService } from '../portfolio.service';
import { PortfolioDashboard } from './portfolio-dashboard';

const SUMMARY: PortfolioSummaryResponse = {
  totalAmountCop: 900000,
  overdueAmountCop: 100000,
  upcomingAmountCop: 500000,
  paidAmountCop: 300000,
  outstandingAmountCop: 600000,
  totalInstallmentsCount: 9,
  overdueInstallmentsCount: 1,
  upcomingInstallmentsCount: 5,
  paidInstallmentsCount: 3,
};

describe('PortfolioDashboard', () => {
  let fixture: ComponentFixture<PortfolioDashboard>;
  let reload: ReturnType<typeof vi.fn>;

  function setup(
    summary: PortfolioSummaryResponse | null = SUMMARY,
    loading = false,
    error: unknown = undefined,
  ) {
    const mockResource = {
      value: signal(summary),
      isLoading: signal(loading),
      error: signal(error),
      reload: vi.fn(),
    };
    reload = mockResource.reload;

    TestBed.configureTestingModule({
      imports: [PortfolioDashboard],
      providers: [
        {
          provide: PortfolioService,
          useValue: {
            summary: () => mockResource,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PortfolioDashboard);
    fixture.detectChanges();
  }

  it('should render the five totals exactly as the backend returns them', () => {
    setup();
    const values = Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid="stat-value"]'),
    ).map((element) => (element as HTMLElement).textContent?.trim());
    expect(values).toHaveLength(5);
    expect(values[0]).toContain('900.000');
    expect(values[1]).toContain('100.000');
    expect(values[2]).toContain('500.000');
    expect(values[3]).toContain('300.000');
    expect(values[4]).toContain('600.000');
    expect(fixture.nativeElement.textContent).toContain('9 cuotas');
  });

  it('should explain an empty portfolio without hiding the cards', () => {
    setup({
      totalAmountCop: 0,
      overdueAmountCop: 0,
      upcomingAmountCop: 0,
      paidAmountCop: 0,
      outstandingAmountCop: 0,
      totalInstallmentsCount: 0,
      overdueInstallmentsCount: 0,
      upcomingInstallmentsCount: 0,
      paidInstallmentsCount: 0,
    });
    expect(fixture.nativeElement.textContent).toContain('Sin cuotas registradas');
  });

  it('should render skeletons while loading', () => {
    setup(null, true);
    const loading = fixture.nativeElement.querySelector('[data-testid="portfolio-loading"]');
    expect(loading).not.toBeNull();
    expect(loading.getAttribute('aria-busy')).toBe('true');
  });

  it('should explain plan gating instead of failing', () => {
    setup(null, false, new HttpErrorResponse({ status: 403 }));
    expect(fixture.nativeElement.textContent).toContain('La cartera no está incluida en tu plan');
  });

  it('should retry on other errors', () => {
    setup(null, false, new Error('fail'));
    expect(fixture.nativeElement.textContent).toContain('No fue posible cargar la cartera.');
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(reload).toHaveBeenCalled();
  });
});
