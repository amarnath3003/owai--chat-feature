// src/ai/ChatInference.ts
// ⚠️ THE ONLY FILE THAT IMPORTS llama.rn ⚠️
// Orchestrates prompt building, streaming tokens through tokenStream,
// and handling cancellation cleanly.

import { modelManager } from './ModelManager';
import { buildPrompt } from './utils/promptBuilder';
import { createTokenStream } from './utils/tokenStream';
import {
  InferenceRequest,
  TokenCallback,
  DoneCallback,
  ErrorCallback,
} from './types';

class ChatInference {
  private isRunning: boolean = false;
  private stopRequested: boolean = false;

  /**
   * Starts inference for the given request.
   * Tokens are emitted via onToken, completion via onDone, errors via onError.
   *
   * Architecture Law: This is the ONLY file that calls llama.rn APIs.
   */
  start(
    request: InferenceRequest,
    onToken: TokenCallback,
    onDone: DoneCallback,
    onError: ErrorCallback,
  ): void {
    if (this.isRunning) {
      onError(new Error('[ChatInference] Inference already in progress.'));
      return;
    }

    const context = modelManager.getLlamaContext();
    if (!context) {
      onError(
        new Error('[ChatInference] No model loaded. Call modelManager.loadModelIfNeeded() first.'),
      );
      return;
    }

    this.isRunning = true;
    this.stopRequested = false;

    const { model, messages, systemPrompt } = request;
    const { temperature, top_p, max_tokens, context_length } =
      model.inferenceDefaults;

    // Build the full prompt string
    const prompt = buildPrompt(messages, systemPrompt, context_length);

    // Accumulate the full response for onDone
    let fullText = '';

    // Set up the token stream with 80ms debounce
    const stream = createTokenStream((buffered: string) => {
      onToken(buffered);
    }, 80);

    // Begin completion (this returns a promise)
    context
      .completion(
        {
          prompt,
          n_predict: max_tokens,
          temperature,
          top_p,
          stop: ['<|im_end|>', '<|im_start|>', '</s>'],
        },
        (data: { token: string }) => {
          // Per-token callback from llama.rn
          if (this.stopRequested) return;
          fullText += data.token;
          stream.push(data.token);
        },
      )
      .then(() => {
        // Flush any remaining buffered tokens
        stream.flush();
        this.isRunning = false;
        onDone(fullText);
      })
      .catch((error: unknown) => {
        stream.cancel();
        this.isRunning = false;
        if (!this.stopRequested) {
          onError(new Error(`[ChatInference] Inference error: ${String(error)}`));
        }
      });
  }

  /**
   * Requests a stop. The current token will finish, then inference halts.
   * Safe to call even if nothing is running.
   */
  stop(): void {
    if (!this.isRunning) return;
    this.stopRequested = true;

    const context = modelManager.getLlamaContext();
    if (context) {
      // llama.rn supports stopCompletion to abort mid-stream
      context.stopCompletion();
    }
  }

  get running(): boolean {
    return this.isRunning;
  }
}

// Singleton inference engine
export const chatInference = new ChatInference();
