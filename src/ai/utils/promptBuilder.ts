// src/ai/utils/promptBuilder.ts
// Builds a ChatML-formatted prompt from a conversation history.
// Trims oldest messages first to stay within context length.

import { ChatMessage } from '../types';

// Rough token estimate: 4 characters ≈ 1 token
const CHARS_PER_TOKEN = 4;

/**
 * Builds a ChatML prompt string from a list of messages.
 *
 * @param messages    The full conversation history (user + assistant turns)
 * @param systemPrompt  Optional system instruction prepended to every prompt
 * @param contextLength Max context tokens allowed (from inferenceDefaults)
 * @returns A formatted prompt string ready for llama.rn
 */
export function buildPrompt(
  messages: ChatMessage[],
  systemPrompt: string = 'You are a helpful assistant.',
  contextLength: number = 2048,
): string {
  const maxChars = contextLength * CHARS_PER_TOKEN;

  const systemBlock = `<|im_start|>system\n${systemPrompt}<|im_end|>\n`;
  const assistantPrompt = `<|im_start|>assistant\n`;

  // Format all messages as ChatML blocks
  const allBlocks = messages.map(m =>
    `<|im_start|>${m.role}\n${m.text}<|im_end|>\n`,
  );

  let included: string[] = [];
  let totalChars = systemBlock.length + assistantPrompt.length;

  // Add messages from newest to oldest, then reverse (trim oldest first)
  for (let i = allBlocks.length - 1; i >= 0; i--) {
    const block = allBlocks[i];
    if (totalChars + block.length > maxChars) {
      break; // Exceeded context — stop here (oldest are already trimmed)
    }
    included.unshift(block);
    totalChars += block.length;
  }

  return systemBlock + included.join('') + assistantPrompt;
}

/**
 * Estimates token count for a string (rough approximation).
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}
