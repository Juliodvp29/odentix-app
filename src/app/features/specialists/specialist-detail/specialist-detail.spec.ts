import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { SettlementResponse, SpecialistResponse } from '../specialist-models';
import { SettlementsService } from '../settlements.service';
import { SpecialistDetail } from './specialist-detail';

const SPECIALIST: SpecialistResponse = {
  id: 'spec-1',
  fullName: 'María Gómez',
  specialty: 'Endodoncia',
  feePercentage: 30,
  paymentTerms: 'Neto 15 días',
};

const HISTORY: SettlementResponse[] = [
  {
    id: 'set-1',
    specialistId: 'spec-1',
    periodStart: '2026-09-01',
    periodEnd: '2026-09-30',
    grossProductionCop: 1000000,
    feeAmountCop: 300000,
    status: 'pendiente',
  },
];

describe('SpecialistDetail', () => {
  let fixture: ComponentFixture<SpecialistDetail>;
  let reloadHistory: ReturnType<typeof vi.fn>;

  function setup(
    list: SpecialistResponse[] | null = [SPECIALIST],
    history: SettlementResponse[] = HISTORY,
    loading = false,
    error = false,
  ) {
    const mockList = {
      value: signal(list),
      isLoading: signal(loading),
      error: signal(error ? new Error('fail') : undefined),
      reload: vi.fn(),
    };
    const mockHistory = {
      value: signal(history),
      isLoading: signal(false),
      error: signal(undefined),
      reload: vi.fn(),
    };
    reloadHistory = mockHistory.reload;

    TestBed.configureTestingModule({
      imports: [SpecialistDetail],
      providers: [
        provideRouter([]),
        {
          provide: SettlementsService,
          useValue: {
            specialists: () => mockList,
            settlements: () => mockHistory,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SpecialistDetail);
    fixture.componentRef.setInput('id', 'spec-1');
    fixture.detectChanges();
  }

  it('should render the specialist header with settlements history', () => {
    setup();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('María Gómez');
    expect(text).toContain('Endodoncia');
    expect(text).toContain('30 %');
    expect(text).toContain('Liquidaciones (1)');
    expect(text).toContain('1.000.000');
    expect(text).toContain('300.000');
    expect(text).toContain('Pendiente');
  });

  it('should render an empty history state', () => {
    setup([SPECIALIST], []);
    expect(fixture.nativeElement.textContent).toContain('Sin liquidaciones registradas');
  });

  it('should embed the generation form in a modal template', () => {
    setup();
    fixture.componentInstance.openGenerate();
    fixture.detectChanges();
    const dialog = document.querySelector('.cdk-overlay-pane');
    expect(dialog?.textContent).toContain('Generar liquidación');
    document.querySelectorAll('.cdk-overlay-container').forEach((element) => element.remove());
    document.documentElement.classList.remove('cdk-global-scrollblock');
  });

  it('should navigate to the settlement detail after generation', () => {
    setup();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance.onGenerated({ id: 'set-9', specialistId: 'spec-1' });
    expect(navigate).toHaveBeenCalledWith(['/specialists', 'spec-1', 'settlements', 'set-9']);
  });

  it('should reload history when the period was already settled', () => {
    setup();
    fixture.componentInstance.onAlreadyExists();
    expect(reloadHistory).toHaveBeenCalled();
  });

  it('should link each settlement to its detail', () => {
    setup();
    const link = fixture.nativeElement.querySelector(
      'a[href="/specialists/spec-1/settlements/set-1"]',
    ) as HTMLAnchorElement;
    expect(link).not.toBeNull();
  });
});
