import { describe, expect, it } from 'vitest';
import { EXAMPLE_QUESTIONS, messageChannelLabel } from './assistant-models';

describe('EXAMPLE_QUESTIONS', () => {
  it('should offer Spanish starting points', () => {
    expect(EXAMPLE_QUESTIONS.length).toBeGreaterThan(0);
    for (const question of EXAMPLE_QUESTIONS) {
      expect(question.endsWith('?')).toBe(true);
    }
  });
});

describe('messageChannelLabel', () => {
  it('should label every known channel', () => {
    expect(messageChannelLabel('whatsapp')).toBe('WhatsApp');
    expect(messageChannelLabel('email')).toBe('Correo electrónico');
    expect(messageChannelLabel('sms')).toBe('SMS');
  });

  it('should fall back for unknown channels', () => {
    expect(messageChannelLabel(null)).toBe('Canal por definir');
    expect(messageChannelLabel('paloma')).toBe('Canal por definir');
  });
});
