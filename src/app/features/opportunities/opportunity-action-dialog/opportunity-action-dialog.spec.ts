import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { OpportunityActionDialog } from './opportunity-action-dialog';
import { OpportunityResponse } from '../opportunity-models';
import { OpportunitiesService } from '../opportunities.service';

const OPPORTUNITY: OpportunityResponse = {
  id: 'o-1',
  type: 'lead_sin_respuesta',
  priority: 5,
  status: 'abierta',
  actions: [
    {
      id: 'a-1',
      actionType: 'enviar_mensaje',
      channel: 'whatsapp',
      suggestedMessage: 'Hola Ana\n¿Seguimos con tu ortodoncia?',
    },
  ],
};

describe('OpportunityActionDialog', () => {
  let fixture: ComponentFixture<OpportunityActionDialog>;
  let executeAction: ReturnType<typeof vi.fn>;

  function setup(opportunity: OpportunityResponse = OPPORTUNITY) {
    executeAction = vi.fn().mockReturnValue(of({ id: 'a-1', executed: true }));
    TestBed.configureTestingModule({
      imports: [OpportunityActionDialog],
      providers: [{ provide: OpportunitiesService, useValue: { executeAction } }],
    }).compileComponents();
    fixture = TestBed.createComponent(OpportunityActionDialog);
    fixture.componentRef.setInput('opportunity', opportunity);
    fixture.detectChanges();
  }

  it('should review the exact message and channel before sending', () => {
    setup();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Enviar mensaje');
    expect(text).toContain('Hola Ana');
    expect(text).toContain('WhatsApp');
    expect(text).toContain('Confirmar y ejecutar');
  });

  it('should execute on confirm and emit the result', async () => {
    setup();
    let emitted: unknown;
    fixture.componentInstance.executed.subscribe((event) => {
      emitted = event;
    });
    fixture.componentInstance.confirm();

    await fixture.whenStable();
    expect(executeAction).toHaveBeenCalledWith('o-1', 'a-1');
    expect(emitted).toBeDefined();
  });

  it('should surface the backend conflict message without closing', async () => {
    setup();
    executeAction.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({ status: 409, error: { message: 'La acción ya fue ejecutada.' } }),
      ),
    );
    let emitted = false;
    fixture.componentInstance.executed.subscribe(() => {
      emitted = true;
    });
    fixture.componentInstance.confirm();

    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('La acción ya fue ejecutada.');
    expect(emitted).toBe(false);
  });

  it('should cancel without executing', () => {
    setup();
    let cancelled = false;
    fixture.componentInstance.cancelled.subscribe(() => {
      cancelled = true;
    });
    fixture.componentInstance.cancel();
    expect(cancelled).toBe(true);
    expect(executeAction).not.toHaveBeenCalled();
  });
});
