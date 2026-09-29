import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '@core/api/api-client';
import {
  AskRequest,
  AskResponse,
  MessageChannel,
  SendMessageRequest,
  SentNotification,
  SuggestMessageRequest,
  SuggestMessageResponse,
} from './assistant-models';

// The AI assistant is a gated plan feature: a tenant without it gets
// 403 instead of answers (explained in the UI, never a dead end).
export function isPlanGateError(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 403;
}

@Injectable({ providedIn: 'root' })
export class AssistantService {
  private readonly api = inject(ApiClient);

  // Asks the backend assistant (LLM call: never instant, the UI
  // designs the wait accordingly). The response flags fallback
  // answers so the chat can label them honestly.
  ask(question: string): Observable<AskResponse> {
    const body: AskRequest = { question };
    return this.api.post<AskRequest, AskResponse>('/api/v1/assistant/ask', body);
  }

  // Suggests a message draft for an appointment without sending or
  // persisting anything: review and sending stay human decisions.
  suggestMessage(appointmentId: string, hint?: string): Observable<SuggestMessageResponse> {
    const body: SuggestMessageRequest = { appointmentId, ...(hint ? { hint } : {}) };
    return this.api.post<SuggestMessageRequest, SuggestMessageResponse>(
      '/api/v1/assistant/suggest-message',
      body,
    );
  }

  // Sends an already reviewed message. The recipient always resolves
  // server-side from the appointment, so the response carries the
  // delivery status (sent/failed with its detail) for explicit feedback.
  sendMessage(
    appointmentId: string,
    channel: MessageChannel,
    body: string,
    subject?: string,
  ): Observable<SentNotification> {
    const request: SendMessageRequest = {
      appointmentId,
      channel,
      body,
      ...(subject ? { subject } : {}),
    };
    return this.api.post<SendMessageRequest, SentNotification>(
      '/api/v1/notifications/send',
      request,
    );
  }
}
