import { describe, expect, it } from 'vitest';
import { ClaudeUsageReading } from './readClaudeUsage';
import { ClaudeUsageState, nextClaudeUsageState } from './state';

const ok: ClaudeUsageState = {
  status: 'ok',
  limits: [{ kind: 'session', model: null, percent: 42, resetsAt: null }],
};
const rateLimited: ClaudeUsageReading = {
  status: 'unavailable',
  reason: 'rate-limited',
};
const signedOut: ClaudeUsageReading = {
  status: 'unavailable',
  reason: 'signed-out',
};

describe('nextClaudeUsageState', () => {
  it('takes a fresh reading', () => {
    expect(nextClaudeUsageState({ status: 'loading' }, ok)).toBe(ok);
  });

  it('keeps the last limits while rate limited', () => {
    expect(nextClaudeUsageState(ok, rateLimited)).toBe(ok);
  });

  it('reports rate limiting when there are no limits to keep', () => {
    expect(nextClaudeUsageState({ status: 'loading' }, rateLimited)).toBe(
      rateLimited
    );
  });

  it('drops the last limits once signed out', () => {
    expect(nextClaudeUsageState(ok, signedOut)).toBe(signedOut);
  });
});
