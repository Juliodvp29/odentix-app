import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { form, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { Button } from '@shared/button/button';
import { FormField } from '@shared/form-field/form-field';
import { Icon } from '@shared/icon/icon';
import { Skeleton } from '@shared/skeleton/skeleton';
import { TextInput } from '@shared/text-input/text-input';
import { ChatMessage, EXAMPLE_QUESTIONS } from '../assistant-models';
import { AssistantService, isPlanGateError } from '../assistant.service';

interface ChatFormModel {
  question: string;
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
  return 'No pudimos obtener una respuesta. Intenta de nuevo.';
}

// Simple question/answer chat over the backend assistant (an LLM call:
// never instant). The thinking state makes the wait explicit instead
// of reading as a frozen app; nothing here sends without the user.
@Component({
  selector: 'app-assistant-chat',
  imports: [Button, FormField, Icon, Skeleton, TextInput],
  templateUrl: './assistant-chat.html',
  host: { class: 'mx-auto block w-full max-w-3xl space-y-24' },
})
export class AssistantChat {
  private readonly assistant = inject(AssistantService);

  readonly examples = EXAMPLE_QUESTIONS;

  readonly model = signal<ChatFormModel>({ question: '' });
  readonly chatForm = form(this.model, (schema) => {
    required(schema.question, { message: 'Escribe una pregunta.' });
  });

  readonly messages = signal<ReadonlyArray<ChatMessage>>([]);
  readonly thinking = signal(false);
  readonly sendError = signal<string | null>(null);
  readonly planGated = signal(false);

  send(): void {
    this.sendError.set(null);
    submit(this.chatForm, () => this.askNow());
  }

  useExample(question: string): void {
    this.model.set({ question });
  }

  retry(): void {
    const lastUser = [...this.messages()].reverse().find((message) => message.role === 'user');
    if (lastUser && !this.thinking()) {
      this.sendError.set(null);
      void this.askNow(lastUser.text);
    }
  }

  private async askNow(raw?: string): Promise<void> {
    const question = (raw ?? this.model().question).trim();
    if (!question || this.thinking()) {
      return;
    }
    this.messages.update((messages) => [...messages, { role: 'user', text: question }]);
    this.model.set({ question: '' });
    this.thinking.set(true);
    try {
      const response = await firstValueFrom(this.assistant.ask(question));
      this.messages.update((messages) => [
        ...messages,
        {
          role: 'assistant',
          text: response.answer || 'El asistente no devolvió una respuesta.',
          fallback: response.fallback ?? false,
        },
      ]);
    } catch (error) {
      if (isPlanGateError(error)) {
        this.planGated.set(true);
        return;
      }
      this.sendError.set(errorMessage(error));
    } finally {
      this.thinking.set(false);
    }
  }
}
