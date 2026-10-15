/**
 * One plan limit as reported by Claude's usage API, the figures `/usage` shows.
 * `kind` is kept as reported so limits added later still appear.
 */
export type ClaudeLimit = {
  kind: string;
  /** Model the limit is scoped to, e.g. a per-model weekly limit. */
  model: string | null;
  /** Share of the limit already used, 0–100. */
  percent: number;
  /** ISO 8601 timestamp when the limit resets, if reported. */
  resetsAt: string | null;
};

const LABELS: Record<string, { label: string; short: string }> = {
  session: { label: 'Session (5h)', short: '5h' },
  weekly_all: { label: 'Weekly', short: '7d' },
  weekly_scoped: { label: 'Weekly', short: '7d' },
};

type RawLimit = {
  kind?: unknown;
  percent?: unknown;
  resets_at?: unknown;
  scope?: { model?: { display_name?: unknown } | null } | null;
};

/** Reads the plan limits from a usage API response, skipping malformed ones. */
export function parseClaudeUsage(response: unknown): ClaudeLimit[] {
  const limits = (response as { limits?: unknown } | null)?.limits;
  if (!Array.isArray(limits)) return [];

  return (limits as RawLimit[]).flatMap((raw) =>
    typeof raw?.kind === 'string' && typeof raw.percent === 'number'
      ? [
          {
            kind: raw.kind,
            model: stringOrNull(raw.scope?.model?.display_name),
            percent: raw.percent,
            resetsAt: stringOrNull(raw.resets_at),
          },
        ]
      : []
  );
}

/** The limit closest to being reached, or null without limits. */
export function findMostUsed(limits: ClaudeLimit[]): ClaudeLimit | null {
  return limits.reduce<ClaudeLimit | null>(
    (most, limit) => (most && most.percent >= limit.percent ? most : limit),
    null
  );
}

/** Full name of a limit, e.g. `Weekly · Fable`. */
export function limitLabel(limit: ClaudeLimit): string {
  return withModel(
    LABELS[limit.kind]?.label ?? rawName(limit),
    limit.model,
    ' · '
  );
}

/** Top-bar abbreviation of a limit, e.g. `7d Fable`. */
export function limitShortLabel(limit: ClaudeLimit): string {
  return withModel(
    LABELS[limit.kind]?.short ?? rawName(limit),
    limit.model,
    ' '
  );
}

function withModel(name: string, model: string | null, separator: string) {
  return model ? `${name}${separator}${model}` : name;
}

function rawName(limit: ClaudeLimit) {
  return limit.kind.replace(/_/g, ' ');
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}
