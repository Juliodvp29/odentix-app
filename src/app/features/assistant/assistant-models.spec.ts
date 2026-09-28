import { describe, expect, it } from 'vitest';
import { EXAMPLE_QUESTIONS } from './assistant-models';

describe('EXAMPLE_QUESTIONS', () => {
  it('should offer Spanish starting points', () => {
    expect(EXAMPLE_QUESTIONS.length).toBeGreaterThan(0);
    for (const question of EXAMPLE_QUESTIONS) {
      expect(question.endsWith('?')).toBe(true);
    }
  });
});
