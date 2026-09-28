import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { OpportunitiesBoard } from './opportunities-board';
import { OpportunityResponse } from '../opportunity-models';
import { OpportunitiesService } from '../opportunities.service';
import { ModalService } from '@shared/modal/modal.service';
import { ToastService } from '@shared/toast/toast.service';

const OPEN: OpportunityResponse[] = [
  {
    id: 'o-1',
    type: 'lead_sin_respuesta',
    priority: 5,
    estimatedValueCop: 300000,
    status: 'abierta',
    detectedAt: '2026-09-20T10:00:00Z',
    actions: [
      {
        id: 'a-1',
        actionType: 'crear_tarea',
        suggestedMessage: 'Llamar a Ana\nInterés en ortodoncia.',
      },
    ],
  },
  {
    id: 'o-2',
    type: 'lead_sin_respuesta',
    priority: 2,
    estimatedValueCop: 500000,
    status: 'en_progreso',
    detectedAt: '2026-09-21T10:00:00Z',
    actions: [{ id: 'a-2', actionType: 'crear_tarea', executed: true }],
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
  let modalOpen: ReturnType<typeof vi.fn>;
  let toastSuccess: ReturnType<typeof vi.fn>;

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
    modalOpen = vi.fn(() => ({ close: vi.fn(), closed: of(null) }));
    toastSuccess = vi.fn();

    TestBed.configureTestingModule({
      imports: [OpportunitiesBoard],
      providers: [
        provideRouter([]),
        { provide: OpportunitiesService, useValue: { open: () => mockResource } },
        { provide: ModalService, useValue: { open: modalOpen } },
        { provide: ToastService, useValue: { success: toastSuccess, error: vi.fn() } },
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

  it('should link to the recovered value view', () => {
    setup();
    const link = fixture.nativeElement.querySelector(
      'a[href="/opportunities/recuperado"]',
    ) as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(link.textContent).toContain('Ver valor recuperado');
  });

  it('should show the empty state without opportunities', () => {
    setup([]);
    expect(fixture.nativeElement.textContent).toContain('No hay oportunidades aquí');
  });

  it('should mark executed actions without an execute button', () => {
    setup();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Ejecutada');
    expect(text).toContain('Revisar y ejecutar');
  });

  it('should open the review dialog for a pending action', () => {
    setup();
    const execute = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Revisar y ejecutar'),
    ) as HTMLButtonElement;
    execute.click();
    expect(modalOpen).toHaveBeenCalled();
    expect(fixture.componentInstance.selectedOpportunity()?.id).toBe('o-1');
  });

  it('should toast and reload after executing an action', () => {
    setup();
    fixture.componentInstance.onActionExecuted({
      opportunity: OPEN[0] as OpportunityResponse,
      action: { actionType: 'crear_tarea', executed: true },
    });
    expect(toastSuccess).toHaveBeenCalledWith('Tarea creada para "Llamar a Ana".');
    expect(reload).toHaveBeenCalled();
    expect(fixture.componentInstance.selectedOpportunity()).toBeNull();
  });

  it('should confirm message delivery after executing a message action', () => {
    setup();
    fixture.componentInstance.onActionExecuted({
      opportunity: OPEN[0] as OpportunityResponse,
      action: { actionType: 'enviar_mensaje', executed: true },
    });
    expect(toastSuccess).toHaveBeenCalledWith('Mensaje enviado al contacto registrado.');
    expect(reload).toHaveBeenCalled();
  });
});
