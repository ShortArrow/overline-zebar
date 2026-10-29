/**
 * The toggle keys the bar reports, in the order their badges appear. Kana
 * comes first: a 101-key keyboard has no key to turn it off, and with it on,
 * fields that turn the IME off receive half-width kana instead of letters.
 */
export const LOCK_KEYS = ['kana', 'caps', 'scroll', 'num'] as const;

export type LockKey = (typeof LOCK_KEYS)[number];

/** Whether each lock is on. */
export type LockState = Record<LockKey, boolean>;

/** The Windows virtual-key code whose toggle bit holds each lock. */
export const VIRTUAL_KEY_CODES: Record<LockKey, number> = {
  kana: 0x15,
  caps: 0x14,
  scroll: 0x91,
  num: 0x90,
};

/**
 * Reads one line printed by the lock keys script, or `null` when the line is
 * not a state with a boolean for every lock.
 */
export function parseLockState(line: string): LockState | null {
  let value: unknown;
  try {
    value = JSON.parse(line.trim());
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null) return null;

  const record = value as Record<string, unknown>;
  return LOCK_KEYS.every((key) => typeof record[key] === 'boolean')
    ? (Object.fromEntries(
        LOCK_KEYS.map((key) => [key, record[key]])
      ) as LockState)
    : null;
}

/** The locks that are on, in badge order; none before the first reading. */
export function activeLockKeys(state: LockState | null): LockKey[] {
  return LOCK_KEYS.filter((key) => state?.[key]);
}
