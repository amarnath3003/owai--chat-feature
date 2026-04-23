// src/ai/utils/tokenStream.ts
// Debounced token stream to prevent per-token re-renders.
// Buffers incoming tokens and flushes them to the UI in batches.

export interface TokenStream {
  /** Push a new token into the buffer */
  push: (token: string) => void;
  /** Immediately flush the current buffer to the callback */
  flush: () => void;
  /** Cancel the stream — clear buffer and stop any pending flush */
  cancel: () => void;
}

/**
 * Creates a debounced token stream.
 *
 * @param onFlush     Called with the accumulated buffer when flushed
 * @param debounceMs  How often to auto-flush (default 80ms — good balance for mobile)
 * @returns           { push, flush, cancel }
 */
export function createTokenStream(
  onFlush: (buffered: string) => void,
  debounceMs: number = 80,
): TokenStream {
  let buffer = '';
  let timer: ReturnType<typeof setTimeout> | null = null;
  let cancelled = false;

  function scheduleFlush(): void {
    if (timer !== null) return; // Already scheduled
    timer = setTimeout(() => {
      timer = null;
      doFlush();
    }, debounceMs);
  }

  function doFlush(): void {
    if (cancelled || buffer === '') return;
    const snapshot = buffer;
    buffer = '';
    onFlush(snapshot);
  }

  const stream: TokenStream = {
    push(token: string): void {
      if (cancelled) return;
      buffer += token;
      scheduleFlush();
    },

    flush(): void {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      doFlush();
    },

    cancel(): void {
      cancelled = true;
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      buffer = '';
    },
  };

  return stream;
}
