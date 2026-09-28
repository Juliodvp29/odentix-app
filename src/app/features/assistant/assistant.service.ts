import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '@core/api/api-client';
import { AskRequest, AskResponse } from './assistant-models';

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
}
