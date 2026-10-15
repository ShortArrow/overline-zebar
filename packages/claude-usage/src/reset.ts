const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * When a limit resets, as `13:00` within a day and `Wed 13:00` beyond it.
 * Null when the API gave no readable time. Locale and time zone default to
 * the viewer's.
 */
export function formatReset(
  resetsAt: string | null,
  now: Date,
  { locale, timeZone }: { locale?: string; timeZone?: string } = {}
): string | null {
  const reset = resetsAt === null ? NaN : Date.parse(resetsAt);
  if (Number.isNaN(reset)) return null;

  return new Intl.DateTimeFormat(locale, {
    weekday: reset - now.getTime() < DAY_MS ? undefined : 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  }).format(reset);
}
