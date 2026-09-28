import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AssistantChat } from './assistant-chat';
import { AskResponse } from '../assistant-models';
import { AssistantService } from '../assistant.service';

describe('AssistantChat', () => {
  let fixture: ComponentFixture<AssistantChat>;
  let ask: ReturnType<typeof vi.fn>;

  function setup() {
    ask = vi.fn().mockReturnValue(of({ answer: 'Tienes 3 citas en riesgo.', fallback: false }));
    TestBed.configureTestingModule({
      imports: [AssistantChat],
      providers: [provideRouter([]), { provide: AssistantService, useValue: { ask } }],
    }).compileComponents();
    fixture = TestBed.createComponent(AssistantChat);
    fixture.detectChanges();
  }

  it('should offer example questions in the empty state', () => {
    setup();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('¿Por dónde empezamos?');
    expect(text).toContain('¿Qué citas tienen riesgo de inasistencia esta semana?');
  });

  it('should fill the input when using an example', () => {
    setup();
    const example = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('saldos vencidos'),
    ) as HTMLButtonElement;
    example.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.model().question).toContain('saldos vencidos');
    expect(ask).not.toHaveBeenCalled();
  });

  it('should show the thinking state while waiting', async () => {
    setup();
    const pending = new Subject<AskResponse>();
    ask.mockReturnValue(pending.asObservable());
    fixture.componentInstance.model.set({ question: '¿Qué citas están en riesgo?' });
    fixture.componentInstance.send();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-testid="assistant-thinking"]'),
    ).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('El asistente está pensando');

    pending.next({ answer: 'Listo.' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="assistant-thinking"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Listo.');
  });

  it('should label fallback answers honestly', async () => {
    setup();
    ask.mockReturnValue(of({ answer: 'Aproximado.', fallback: true }));
    fixture.componentInstance.model.set({ question: 'Dime algo' });
    fixture.componentInstance.send();

    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Respuesta de respaldo');
  });

  it('should retry after an error', async () => {
    setup();
    ask.mockReturnValue(throwError(() => new Error('down')));
    fixture.componentInstance.model.set({ question: '¿Y hoy?' });
    fixture.componentInstance.send();

    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No pudimos obtener una respuesta.');
    const retry = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Reintentar'),
    ) as HTMLButtonElement;
    ask.mockReturnValue(of({ answer: 'Recuperado.' }));
    retry.click();

    await fixture.whenStable();
    fixture.detectChanges();
    expect(ask).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('Recuperado.');
  });

  it('should explain plan gating instead of failing', async () => {
    setup();
    ask.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    fixture.componentInstance.model.set({ question: 'Hola' });
    fixture.componentInstance.send();

    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('El asistente no está incluido en tu plan');
  });
});
