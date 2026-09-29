import { components } from '@core/api/schema';

export type AskRequest = components['schemas']['AskRequest'];
export type AskResponse = components['schemas']['AskResponse'];
export type SuggestMessageRequest = components['schemas']['SuggestMessageRequest'];
export type SuggestMessageResponse = components['schemas']['SuggestMessageResponse'];
export type SendMessageRequest = components['schemas']['SendMessageRequest'];
export type SentNotification = components['schemas']['NotificationResponse'];

export type MessageChannel = 'email' | 'whatsapp' | 'sms';

export interface ChatMessage {
  readonly role: 'user' | 'assistant';
  readonly text: string;
  readonly fallback?: boolean;
}

// Starting points shown in the empty state. They fill the input;
// sending always stays an explicit user action.
export const EXAMPLE_QUESTIONS: ReadonlyArray<string> = [
  '¿Qué citas tienen riesgo de inasistencia esta semana?',
  '¿Qué saldos vencidos debería cobrar primero?',
  '¿Qué leads llevan más tiempo sin respuesta?',
];

export function messageChannelLabel(channel: string | null | undefined): string {
  if (channel === 'whatsapp') {
    return 'WhatsApp';
  }
  if (channel === 'email') {
    return 'Correo electrónico';
  }
  if (channel === 'sms') {
    return 'SMS';
  }
  return 'Canal por definir';
}
