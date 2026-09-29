import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { MessageComposeDialog } from './message-compose-dialog';
import { AssistantService } from '../assistant.service';

const SUGGESTION = {
  message: 'Hola Ana, te esperamos mañana a las 10:00.',
  suggestedChannel: 'whatsapp',
  fallback: false,
};

describe('MessageComposeDialog', () => {
  let fixture: ComponentFixture<MessageComposeDialog>;
  let suggestMessage: ReturnType<typeof vi.fn>;
  let sendMessage: ReturnType<typeof vi.fn>;

  function setup(suggestImpl: () => unknown = () => of(SUGGESTION)) {
    suggestMessage = vi.fn().mockImplementation(suggestImpl);
    sendMessage = vi.fn().mockReturnValue(of({ id: 'n-1', status: 'enviada' }));
    TestBed.configureTestingModule({
      imports: [MessageComposeDialog],
      providers: [{ provide: AssistantService, useValue: { suggestMessage, sendMessage } }],
    }).compileComponents();
    fixture = TestBed.createComponent(MessageComposeDialog);
    fixture.componentRef.setInput('appointmentId', 'appt-1');
    fixture.detectChanges();
  }

  it('should suggest on open and fill the editable draft', async () => {
    setup();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(suggestMessage).toHaveBeenCalledWith('appt-1');
    expect(fixture.componentInstance.model().body).toBe(
      'Hola Ana, te esperamos mañana a las 10:00.',
    );
    expect(fixture.nativeElement.textContent).toContain('WhatsApp');
  });

  it('should send the edited text only on confirm', async () => {
    setup();
    await fixture.whenStable();
    fixture.componentInstance.model.update((current) => ({
      ...current,
      body: 'Hola Ana, te esperamos a las 11:00.',
    }));
    fixture.componentInstance.send();

    await fixture.whenStable();
    expect(sendMessage).toHaveBeenCalledWith(
      'appt-1',
      'whatsapp',
      'Hola Ana, te esperamos a las 11:00.',
      undefined,
    );
  });

  it('should explain plan gating instead of failing', async () => {
    setup(() => throwError(() => new HttpErrorResponse({ status: 403 })));

    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('El asistente no está incluido en tu plan');
  });

  it('should surface send errors without closing', async () => {
    setup();
    await fixture.whenStable();
    sendMessage.mockReturnValue(throwError(() => new Error('down')));
    let emitted = false;
    fixture.componentInstance.sent.subscribe(() => {
      emitted = true;
    });
    fixture.componentInstance.send();

    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No pudimos completar la operación.');
    expect(emitted).toBe(false);
  });

  it('should cancel without suggesting twice or sending', () => {
    setup();
    let cancelled = false;
    fixture.componentInstance.cancelled.subscribe(() => {
      cancelled = true;
    });
    fixture.componentInstance.cancel();
    expect(cancelled).toBe(true);
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
