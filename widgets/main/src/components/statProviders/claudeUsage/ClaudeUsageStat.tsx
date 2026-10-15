import {
  findMostUsed,
  limitShortLabel,
  useClaudeUsage,
} from '@overline-zebar/claude-usage';
import { Threshold } from '@overline-zebar/config';
import { Sparkle } from 'lucide-react';
import Stat from '../../stat/Stat';

/**
 * Shows the Claude plan limit closest to being reached, as `/usage` reports
 * it, and renders nothing until a reading arrives. Inline names the limit;
 * the ring carries just the icon.
 */
export default function ClaudeUsageStat({
  inline,
  thresholds,
}: {
  inline: boolean;
  thresholds: Threshold[];
}) {
  const usage = useClaudeUsage();
  if (usage.status !== 'ok') return null;

  const limit = findMostUsed(usage.limits);
  if (!limit) return null;

  return (
    <Stat
      Icon={
        <span className="flex items-center gap-0.5 font-medium text-icon">
          <Sparkle
            className="size-3.5"
            aria-hidden={inline}
            aria-label={inline ? undefined : 'Claude usage'}
          />
          {inline && limitShortLabel(limit)}
        </span>
      }
      stat={`${Math.round(limit.percent)}%`}
      type={inline ? 'inline' : 'ring'}
      threshold={thresholds}
    />
  );
}
