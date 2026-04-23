// tests/tokenStream.test.ts

import { createTokenStream } from '../src/ai/utils/tokenStream';

describe('createTokenStream', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('does not flush immediately when a token is pushed', () => {
    const onFlush = jest.fn();
    const stream = createTokenStream(onFlush, 100);

    stream.push('hello');

    expect(onFlush).not.toHaveBeenCalled();
  });

  test('flushes after debounce interval', () => {
    const onFlush = jest.fn();
    const stream = createTokenStream(onFlush, 100);

    stream.push('hello');
    stream.push(' world');

    jest.advanceTimersByTime(100);

    expect(onFlush).toHaveBeenCalledTimes(1);
    expect(onFlush).toHaveBeenCalledWith('hello world');
  });

  test('buffers multiple tokens and sends them as one batch', () => {
    const onFlush = jest.fn();
    const stream = createTokenStream(onFlush, 80);

    stream.push('The ');
    stream.push('quick ');
    stream.push('brown ');
    stream.push('fox');

    jest.advanceTimersByTime(80);

    expect(onFlush).toHaveBeenCalledTimes(1);
    expect(onFlush).toHaveBeenCalledWith('The quick brown fox');
  });

  test('flush() forces immediate emit without waiting for debounce', () => {
    const onFlush = jest.fn();
    const stream = createTokenStream(onFlush, 200);

    stream.push('immediate');
    stream.flush();

    expect(onFlush).toHaveBeenCalledTimes(1);
    expect(onFlush).toHaveBeenCalledWith('immediate');
  });

  test('flush() clears the pending debounce timer', () => {
    const onFlush = jest.fn();
    const stream = createTokenStream(onFlush, 100);

    stream.push('test');
    stream.flush(); // Should flush now and cancel timer

    jest.advanceTimersByTime(100); // Timer fires but buffer is empty

    // flush + timer = still only 1 call
    expect(onFlush).toHaveBeenCalledTimes(1);
  });

  test('cancel() stops all future flushing', () => {
    const onFlush = jest.fn();
    const stream = createTokenStream(onFlush, 100);

    stream.push('never');
    stream.cancel();

    jest.advanceTimersByTime(200);

    expect(onFlush).not.toHaveBeenCalled();
  });

  test('cancel() clears the buffer', () => {
    const onFlush = jest.fn();
    const stream = createTokenStream(onFlush, 100);

    stream.push('data');
    stream.cancel();
    stream.flush(); // Should be a no-op after cancel

    expect(onFlush).not.toHaveBeenCalled();
  });

  test('push() after cancel() is ignored', () => {
    const onFlush = jest.fn();
    const stream = createTokenStream(onFlush, 100);

    stream.cancel();
    stream.push('ignored');

    jest.advanceTimersByTime(200);

    expect(onFlush).not.toHaveBeenCalled();
  });

  test('flush() on empty buffer does not call onFlush', () => {
    const onFlush = jest.fn();
    const stream = createTokenStream(onFlush, 100);

    stream.flush();

    expect(onFlush).not.toHaveBeenCalled();
  });
});
