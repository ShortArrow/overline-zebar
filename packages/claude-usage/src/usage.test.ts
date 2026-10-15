import { describe, expect, it } from 'vitest';
import {
  findMostUsed,
  limitLabel,
  limitShortLabel,
  parseClaudeUsage,
} from './usage';

const response = {
  five_hour: { utilization: 6, resets_at: '2026-10-15T02:10:00.261461+00:00' },
  limits: [
    {
      kind: 'session',
      group: 'session',
      percent: 6,
      severity: 'normal',
      resets_at: '2026-10-15T02:10:00.261461+00:00',
      scope: null,
      is_active: true,
    },
    {
      kind: 'weekly_all',
      group: 'weekly',
      percent: 31,
      severity: 'normal',
      resets_at: '2026-10-21T13:00:00.261485+00:00',
      scope: null,
      is_active: false,
    },
    {
      kind: 'weekly_scoped',
      group: 'weekly',
      percent: 0,
      severity: 'normal',
      resets_at: '2026-10-21T13:00:00+00:00',
      scope: { model: { id: null, display_name: 'Fable' }, surface: null },
      is_active: false,
    },
  ],
};

describe('parseClaudeUsage', () => {
  it('reads each plan limit in the order the API reports them', () => {
    expect(parseClaudeUsage(response)).toEqual([
      {
        kind: 'session',
        model: null,
        percent: 6,
        resetsAt: '2026-10-15T02:10:00.261461+00:00',
      },
      {
        kind: 'weekly_all',
        model: null,
        percent: 31,
        resetsAt: '2026-10-21T13:00:00.261485+00:00',
      },
      {
        kind: 'weekly_scoped',
        model: 'Fable',
        percent: 0,
        resetsAt: '2026-10-21T13:00:00+00:00',
      },
    ]);
  });

  it('skips limits without a percentage and tolerates a missing reset time', () => {
    const usage = {
      limits: [
        { kind: 'session', percent: null, resets_at: null },
        { kind: 'weekly_all', percent: 12, resets_at: null },
      ],
    };

    expect(parseClaudeUsage(usage)).toEqual([
      { kind: 'weekly_all', model: null, percent: 12, resetsAt: null },
    ]);
  });

  it('reads nothing from a response without limits', () => {
    expect(parseClaudeUsage({})).toEqual([]);
    expect(parseClaudeUsage(null)).toEqual([]);
    expect(parseClaudeUsage({ limits: 'none' })).toEqual([]);
  });
});

describe('findMostUsed', () => {
  it('picks the limit with the highest percentage', () => {
    expect(findMostUsed(parseClaudeUsage(response))?.kind).toBe('weekly_all');
  });

  it('finds nothing without limits', () => {
    expect(findMostUsed([])).toBeNull();
  });
});

describe('limit labels', () => {
  const limit = (kind: string, model: string | null = null) => ({
    kind,
    model,
    percent: 0,
    resetsAt: null,
  });

  it('names the known limits and their scoped model', () => {
    expect(limitLabel(limit('session'))).toBe('Session (5h)');
    expect(limitLabel(limit('weekly_all'))).toBe('Weekly');
    expect(limitLabel(limit('weekly_scoped', 'Fable'))).toBe('Weekly · Fable');
  });

  it('abbreviates them for the top bar', () => {
    expect(limitShortLabel(limit('session'))).toBe('5h');
    expect(limitShortLabel(limit('weekly_all'))).toBe('7d');
    expect(limitShortLabel(limit('weekly_scoped', 'Fable'))).toBe('7d Fable');
  });

  it('falls back to the raw kind for limits it does not know', () => {
    expect(limitLabel(limit('monthly_all'))).toBe('monthly all');
    expect(limitShortLabel(limit('monthly_all'))).toBe('monthly all');
  });
});
