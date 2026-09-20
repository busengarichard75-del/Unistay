// src/lib/firestoreRetry.ts

/**
 * Network-resilient wrappers for Firestore calls.
 *
 * Designed for unreliable mobile networks (3G, weak signal).
 * Reads should NEVER hang forever or fail on a single transient error.
 *
 * Two building blocks:
 *   - withTimeout: rejects a promise if it takes too long
 *   - withRetry:   retries a callable with exponential backoff + timeout per attempt
 */

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Request timed out after ${ms}ms`);
    this.name = "TimeoutError";
  }
}

/**
 * Reject if the promise doesn't settle within `ms`.
 * The original promise keeps running in the background — harmless for Firestore reads.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new TimeoutError(ms)), ms)
    ),
  ]);
}

export interface RetryOptions {
  /** Number of total attempts (default: 3) */
  attempts?: number;
  /** Per-attempt timeout in ms (default: 15000 = 15s) */
  timeoutMs?: number;
  /** Base delay before first retry in ms (default: 500) */
  baseDelayMs?: number;
  /** Optional predicate to skip retry for permanent errors (e.g. permission-denied) */
  shouldRetry?: (err: unknown) => boolean;
}

/**
 * Retry a callable with exponential backoff.
 * Each attempt is wrapped in a fresh timeout.
 *
 * Timeline (defaults):
 *   Attempt 1 at t=0
 *   Attempt 2 at t=500ms (after 1st fails/times out)
 *   Attempt 3 at t=1500ms (after 2nd fails/times out)
 *   Throws the last error if all fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  const attempts = opts.attempts ?? 3;
  const timeoutMs = opts.timeoutMs ?? 15000;
  const baseDelayMs = opts.baseDelayMs ?? 500;
  const shouldRetry = opts.shouldRetry ?? (() => true);

  let lastErr: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      return await withTimeout(fn(), timeoutMs);
    } catch (err) {
      lastErr = err;

      const isLast = i === attempts - 1;
      if (isLast || !shouldRetry(err)) {
        break;
      }

      // Exponential backoff: 500ms, 1000ms, 2000ms, ...
      const delay = baseDelayMs * Math.pow(2, i);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastErr;
}

/**
 * Ready-made predicate for Firestore errors that should NOT be retried.
 * (Permanent failures — retrying wastes time and network.)
 */
export function isPermanentFirestoreError(err: unknown): boolean {
  const code = (err as any)?.code;
  if (!code) return false;
  return (
    code === "permission-denied" ||
    code === "unauthenticated" ||
    code === "invalid-argument" ||
    code === "not-found"
  );
}

/**
 * Default retry predicate for reads: retry everything EXCEPT permanent errors.
 */
export function shouldRetryRead(err: unknown): boolean {
  return !isPermanentFirestoreError(err);
}