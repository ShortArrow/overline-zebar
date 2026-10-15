import { ClaudeUsageReading } from './readClaudeUsage';

export type ClaudeUsageState = { status: 'loading' } | ClaudeUsageReading;

/**
 * The state after a new reading. Rate limiting is temporary and the limits
 * move slowly, so the last limits stay shown through it; any other failure
 * replaces them.
 */
export function nextClaudeUsageState(
  previous: ClaudeUsageState,
  reading: ClaudeUsageReading
): ClaudeUsageState {
  const isRateLimited =
    reading.status === 'unavailable' && reading.reason === 'rate-limited';
  return isRateLimited && previous.status === 'ok' ? previous : reading;
}
