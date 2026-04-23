// tests/promptBuilder.test.ts

import { buildPrompt, estimateTokens } from '../src/ai/utils/promptBuilder';
import { ChatMessage } from '../src/ai/types';

const SYSTEM = 'You are a helpful assistant.';

describe('buildPrompt', () => {
  test('includes system prompt always', () => {
    const messages: ChatMessage[] = [
      { role: 'user', text: 'Hello' },
    ];
    const result = buildPrompt(messages, SYSTEM, 2048);
    expect(result).toContain(SYSTEM);
  });

  test('includes user message', () => {
    const messages: ChatMessage[] = [
      { role: 'user', text: 'What is 2+2?' },
    ];
    const result = buildPrompt(messages, SYSTEM, 2048);
    expect(result).toContain('What is 2+2?');
  });

  test('formats in ChatML template', () => {
    const messages: ChatMessage[] = [
      { role: 'user', text: 'Hi' },
      { role: 'assistant', text: 'Hello!' },
    ];
    const result = buildPrompt(messages, SYSTEM, 2048);
    expect(result).toContain('<|im_start|>user');
    expect(result).toContain('<|im_start|>assistant');
    expect(result).toContain('<|im_end|>');
  });

  test('handles empty history (only system + final assistant prompt)', () => {
    const result = buildPrompt([], SYSTEM, 2048);
    expect(result).toContain(SYSTEM);
    expect(result).toContain('<|im_start|>assistant');
  });

  test('trims oldest messages when history exceeds context length', () => {
    // Create many messages that will exceed a tiny context
    const messages: ChatMessage[] = Array.from({ length: 100 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      text: `Message number ${i} — some padding text to make it longer`,
    }));

    const result = buildPrompt(messages, SYSTEM, 128); // Very small context

    // System prompt must still be there
    expect(result).toContain(SYSTEM);

    // Result must not be excessively long
    const estimatedTokens = estimateTokens(result);
    expect(estimatedTokens).toBeLessThanOrEqual(200); // Small buffer allowed
  });

  test('newest messages are preserved when trimming oldest', () => {
    const messages: ChatMessage[] = [
      { role: 'user', text: 'OLDEST_MESSAGE' },
      ...Array.from({ length: 50 }, (_, i) => ({
        role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        text: `Filler message ${i} with some text to consume tokens`.repeat(3),
      })),
      { role: 'user', text: 'NEWEST_MESSAGE' },
    ];

    const result = buildPrompt(messages, SYSTEM, 256);

    // Newest message should be present; oldest may be trimmed
    expect(result).toContain('NEWEST_MESSAGE');
  });
});

describe('estimateTokens', () => {
  test('estimates roughly 1 token per 4 chars', () => {
    const text = 'a'.repeat(400);
    expect(estimateTokens(text)).toBe(100);
  });

  test('handles empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });
});
