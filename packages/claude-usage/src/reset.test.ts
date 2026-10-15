import { describe, expect, it } from 'vitest';
import { formatReset } from './reset';

const now = new Date('2026-10-15T00:00:00Z');
const format = (resetsAt: string | null) =>
  formatReset(resetsAt, now, { locale: 'en-GB', timeZone: 'UTC' });

describe('formatReset', () => {
  it('shows only the time for a reset within a day', () => {
    expect(format('2026-10-15T02:10:00.261461+00:00')).toBe('02:10');
  });

  it('adds the weekday for a reset further away', () => {
    expect(format('2026-10-21T13:00:00+00:00')).toBe('Wed 13:00');
  });

  it('shows nothing without a readable reset time', () => {
    expect(format(null)).toBeNull();
    expect(format('soon')).toBeNull();
  });
});
