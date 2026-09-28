import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { OpportunitiesBoard } from './opportunities-board';
import { OpportunityResponse } from '../opportunity-models';
import { OpportunitiesService } from '../opportunities.service';

const OPEN: OpportunityResponse[] = [
  {
    id: 'o-1',
    type: 'lead_sin_respuesta',
    priority: 5,
    estimatedValueCop: 300000,
    status: 'abierta',
    detectedAt: '2026-09-20T10:00:00Z',
    actions: [
      { actionType: 'crear_tarea', suggestedMessage: 'Llamar a Ana\nInterés en ortodoncia.' },
    ],
  },
  {
    id: 'o-2',
    type: 'lead_sin_respuesta',
    priority: 2,
    estimatedValueCop: 500000,
    status: 'en_progreso',
    detectedAt: '2026-09-21T10:00:00Z',
  },
  {
    id: 'o-3',
    type: 'saldo_vencido',
    priority: 4,
    estimatedValueCop: 150000,
    status: 'resuelta',
    detectedAt: '2026-09-22T10:00:00Z',
  },
];

describe('OpportunitiesBoard', () => {
  let fixture: ComponentFixture<OpportunitiesBoard>;
  let reload: ReturnType<typeof vi.fn>;

  function setup(
    opportunities: OpportunityResponse[] | null = OPEN,
    loading = false,
    error: unknown = undefined,
  ) {
    const mockResource = {
      value: signal(opportunities),
      isLoading: signal(loading),
      error: signal(error),
      reload: vi.fn(),
    };
    reload = mockResource.reload;

    TestBed.configureTestingModule({
      imports: [OpportunitiesBoard],
      providers: [
        provideRouter([]),
        { provide: OpportunitiesService, useValue: { open: () => mockResource } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OpportunitiesBoard);
    fixture.detectChanges();
  }

  it('should render active groups with the value at stake', () => {
    setup();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Oportunidades');
    expect(text).toContain('Valor en juego');
    expect(text).toContain('Lead sin respuesta');
    expect(text).toContain('Llamar a Ana');
    expect(text).toContain('Crear tarea');
    expect(text).not.toContain('Saldo vencido');
  });

  it('should emphasize the highest-priority card with teal', () => {
    setup();
    const cards = fixture.nativeElement.querySelectorAll('article');
    expect(cards[0]?.className).toContain('border-teal');
    expect(fixture.nativeElement.textContent).toContain('Prioridad alta');
  });

  it('should switch segments without refetching', () => {
    setup();
    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]');
    (tabs[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Saldo vencido');
    expect(text).not.toContain('Llamar a Ana');
    expect(reload).not.toHaveBeenCalled();
  });

  it('should render skeletons while loading', () => {
    setup(null, true);
    const loading = fixture.nativeElement.querySelector('[data-testid="opportunities-loading"]');
    expect(loading).not.toBeNull();
    expect(loading.getAttribute('aria-busy')).toBe('true');
  });

  it('should explain plan gating instead of failing', () => {
    setup(null, false, new HttpErrorResponse({ status: 403 }));
    expect(fixture.nativeElement.textContent).toContain(
      'Las oportunidades no están incluidas en tu plan',
    );
  });

  it('should retry on other errors', () => {
    setup(null, false, new Error('fail'));
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar las oportunidades.');
    const button = fixture.nativeElement.querySelector(
      'section[role="alert"] button',
    ) as HTMLButtonElement;
    button.click();
    expect(reload).toHaveBeenCalled();
  });

  it('should show the empty state without opportunities', () => {
    setup([]);
    expect(fixture.nativeElement.textContent).toContain('No hay oportunidades aquí');
  });
});
