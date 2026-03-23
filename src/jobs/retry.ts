import { SOURCE_RETRY_CONFIG } from './queue';

export const RETRY_CONFIG = {
  baseDelay: 3000,
  maxDelay: 60000,
  maxAttempts: 3,

  getDelay(attempt: number): number {
    const delay = this.baseDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, this.maxDelay);
  },

  shouldRetry(error: Error, attempt: number): boolean {
    if (attempt >= this.maxAttempts) return false;

    const nonRetryable = [
      'CAPTCHA detected',
      'Authentication required',
      'Account locked',
    ];

    return !nonRetryable.some(e => error.message.includes(e));
  },
};

export function calculateBackoffDelays(): [number, number, number] {
  return [3000, 6000, 12000];
}
