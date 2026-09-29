import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { form, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { Button } from '@shared/button/button';
import { FormField } from '@shared/form-field/form-field';
import { Icon } from '@shared/icon/icon';
import { Select, SelectOption } from '@shared/select/select';
import { Skeleton } from '@shared/skeleton/skeleton';
import { TextArea } from '@shared/text-area/text-area';
import { TextInput } from '@shared/text-input/text-input';
import { MessageChannel, SentNotification } from '../assistant-models';
import { AssistantService, isPlanGateError } from '../assistant.service';

interface ComposeFormModel {
  channel: string;
  subject: string;
  body: string;
}

const CHANNEL_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Correo electrónico' },
  { value: 'sms', label: 'SMS' },
];

function isMessageChannel(value: string | null | undefined): value is MessageChannel {
  return value === 'whatsapp' || value === 'email' || value === 'sms';
}

function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { message?: unknown; error?: unknown } | null;
    if (typeof body?.message === 'string') {
      return body.message;
    }
    if (typeof body?.error === 'string') {
      return body.error;
    }
  }
  return 'No pudimos completar la operación. Intenta de nuevo.';
}

// Suggest → review/edit → explicit send for an appointment message.
// Nothing here sends on its own: the suggestion only fills the draft,
// and delivery happens solely through the send button below.
@Component({
  selector: 'app-message-compose-dialog',
  imports: [Button, FormField, Icon, Select, Skeleton, TextArea, TextInput],
  templateUrl: './message-compose-dialog.html',
  host: { class: 'block' },
})
export class MessageComposeDialog implements OnInit {
  readonly appointmentId = input.required<string>();
  readonly sent = output<SentNotification>();
  readonly cancelled = output<void>();

  private readonly assistant = inject(AssistantService);

  readonly channelOptions = CHANNEL_OPTIONS;

  readonly suggesting = signal(true);
  readonly suggestError = signal<string | null>(null);
  readonly planGated = signal(false);
  readonly isFallback = signal(false);

  readonly model = signal<ComposeFormModel>({ channel: 'whatsapp', body: '', subject: '' });
  readonly composeForm = form(this.model, (schema) => {
    required(schema.channel, { message: 'Elige un canal.' });
    required(schema.body, { message: 'El mensaje es obligatorio.' });
  });
  readonly sending = signal(false);
  readonly sendError = signal<string | null>(null);

  readonly showSubject = signal(false);

  ngOnInit(): void {
    void this.suggest();
  }

  async suggest(): Promise<void> {
    const appointmentId = this.appointmentId();
    if (!appointmentId) {
      return;
    }
    this.suggestError.set(null);
    this.suggesting.set(true);
    try {
      const suggestion = await firstValueFrom(this.assistant.suggestMessage(appointmentId));
      const channel = isMessageChannel(suggestion.suggestedChannel)
        ? suggestion.suggestedChannel
        : 'whatsapp';
      this.model.set({ channel, subject: '', body: suggestion.message ?? '' });
      this.showSubject.set(channel === 'email');
      this.isFallback.set(suggestion.fallback ?? false);
    } catch (error) {
      if (isPlanGateError(error)) {
        this.planGated.set(true);
        return;
      }
      this.suggestError.set(errorMessage(error));
    } finally {
      this.suggesting.set(false);
    }
  }

  onChannelChange(channel: string): void {
    this.model.update((current) => ({ ...current, channel }));
    this.showSubject.set(channel === 'email');
  }

  send(): void {
    this.sendError.set(null);
    submit(this.composeForm, () => this.deliver());
  }

  cancel(): void {
    if (!this.sending()) {
      this.cancelled.emit();
    }
  }

  private async deliver(): Promise<void> {
    const appointmentId = this.appointmentId();
    const { channel, subject, body } = this.model();
    if (!appointmentId || !isMessageChannel(channel) || !body.trim()) {
      return;
    }
    this.sending.set(true);
    try {
      const notification = await firstValueFrom(
        this.assistant.sendMessage(
          appointmentId,
          channel,
          body.trim(),
          subject.trim() || undefined,
        ),
      );
      this.sent.emit(notification);
    } catch (error) {
      this.sendError.set(errorMessage(error));
    } finally {
      this.sending.set(false);
    }
  }
}
