import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { SettlementBreakdownResponse, SettlementResponse } from '../specialist-models';
import { SettlementsService } from '../settlements.service';
import { SettlementDetail } from './settlement-detail';

const SETTLEMENT: SettlementResponse = {
  id: 'set-1',
  specialistId: 'spec-1',
  periodStart: '2026-09-01',
  periodEnd: '2026-09-30',
  grossProductionCop: 540000,
  feeAmountCop: 162000,
  status: 'pendiente',
};

const BREAKDOWN: SettlementBreakdownResponse = {
  settlementId: 'set-1',
  specialistId: 'spec-1',
  grossProductionCop: 540000,
  feeAmountCop: 162000,
  status: 'pendiente',
  invoiceCount: 2,
  invoices: [
    {
      invoiceId: 'inv-1',
      invoiceNumber: 'FAC-000001',
      issuedAt: '2026-09-10T12:00:00Z',
      status: 'pagada',
      totalCop: 400000,
    },
    {
      invoiceId: 'inv-2',
      invoiceNumber: 'FAC-000002',
      issuedAt: '2026-09-20T12:00:00Z',
      status: 'pendiente',
      totalCop: 140000,
    },
  ],
};

describe('SettlementDetail', () => {
  let fixture: ComponentFixture<SettlementDetail>;

  function setup(
    settlement: SettlementResponse | null = SETTLEMENT,
    breakdown: SettlementBreakdownResponse | null = BREAKDOWN,
    loading = false,
    error = false,
  ) {
    const mockSettlement = {
      value: signal(settlement),
      isLoading: signal(loading),
      error: signal(error ? new Error('fail') : undefined),
      reload: vi.fn(),
    };
    const mockBreakdown = {
      value: signal(breakdown),
      isLoading: signal(false),
      error: signal(undefined),
      reload: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [SettlementDetail],
      providers: [
        provideRouter([]),
        {
          provide: SettlementsService,
          useValue: {
            settlement: () => mockSettlement,
            breakdown: () => mockBreakdown,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettlementDetail);
    fixture.componentRef.setInput('specialistId', 'spec-1');
    fixture.componentRef.setInput('settlementId', 'set-1');
    fixture.detectChanges();
  }

  it('should render the settlement with its attributed invoices', () => {
    setup();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('2026-09-01 al 2026-09-30');
    expect(text).toContain('Pendiente');
    expect(text).toContain('FAC-000001');
    expect(text).toContain('FAC-000002');
    const gross = fixture.nativeElement.querySelector('[data-testid="settlement-gross"]');
    expect(gross.textContent).toContain('540.000');
    const link = fixture.nativeElement.querySelector(
      'a[href="/billing/inv-1"]',
    ) as HTMLAnchorElement;
    expect(link).not.toBeNull();
  });

  it('should reconcile the visible lines with the settled gross', () => {
    setup();
    expect(fixture.componentInstance.linesSubtotal()).toBe(540000);
    expect(fixture.componentInstance.drifted()).toBe(false);
  });

  it('should warn when the live lines drift from the settled gross', () => {
    setup(SETTLEMENT, { ...BREAKDOWN, invoices: [BREAKDOWN.invoices![0]] });
    fixture.detectChanges();
    expect(fixture.componentInstance.drifted()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('ya no coincide con el bruto liquidado');
  });

  it('should render loading skeleton while resolving', () => {
    setup(null, null, true);
    const loading = fixture.nativeElement.querySelector('[data-testid="detail-loading"]');
    expect(loading).not.toBeNull();
    expect(loading.getAttribute('aria-busy')).toBe('true');
  });
});
