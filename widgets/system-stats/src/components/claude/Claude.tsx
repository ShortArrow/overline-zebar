import {
  ClaudeLimit,
  ClaudeUsageProblem,
  formatReset,
  limitLabel,
  useClaudeUsage,
} from '@overline-zebar/claude-usage';
import { Card, CardTitle, PanelLayout, Progress } from '@overline-zebar/ui';

const problemHints: Record<ClaudeUsageProblem | 'empty', string> = {
  'signed-out':
    'Sign in to Claude Code on this machine; an expired sign-in renews the next time Claude Code runs.',
  'rate-limited':
    'Claude is rate limiting usage requests; it is asked again in a few minutes.',
  error: 'Claude could not be reached; it is asked again in a few minutes.',
  empty: 'Claude reported no plan limits.',
};

export default function Claude() {
  const usage = useClaudeUsage();

  if (usage.status === 'loading') return null;

  if (usage.status === 'unavailable' || usage.limits.length === 0) {
    const hint =
      problemHints[usage.status === 'unavailable' ? usage.reason : 'empty'];
    return (
      <PanelLayout className="p-2 px-2.5">
        <div className="flex flex-col justify-center items-center text-center select-text w-full text-text-muted h-full gap-1">
          <p>Claude usage not available.</p>
          <p>{hint}</p>
        </div>
      </PanelLayout>
    );
  }

  const now = new Date();
  return (
    <PanelLayout className="p-2 px-2.5 space-y-2">
      {usage.limits.map((limit) => (
        <LimitCard
          key={`${limit.kind}:${limit.model ?? ''}`}
          limit={limit}
          now={now}
        />
      ))}
    </PanelLayout>
  );
}

function LimitCard({ limit, now }: { limit: ClaudeLimit; now: Date }) {
  const reset = formatReset(limit.resetsAt, now);

  return (
    <Card className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <CardTitle>{limitLabel(limit)}</CardTitle>
        <p className="tabular-nums font-medium">{`${Math.round(limit.percent)}%`}</p>
      </div>
      <div className="space-y-1.5">
        <Progress value={limit.percent} />
        {reset && <p className="text-text-muted">Resets {reset}</p>}
      </div>
    </Card>
  );
}
