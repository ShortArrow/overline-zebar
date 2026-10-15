import { useEffect, useState } from 'react';
import * as zebar from 'zebar';
import { ClaudeUsageReading, readClaudeUsage } from './readClaudeUsage';

export type ClaudeUsageState = { status: 'loading' } | ClaudeUsageReading;

/**
 * Polls Claude's plan limits while the component is mounted. Each poll starts
 * a PowerShell process, so the interval is minutes rather than seconds.
 */
export function useClaudeUsage(intervalMs = 120_000): ClaudeUsageState {
  const [state, setState] = useState<ClaudeUsageState>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    const poll = async () => {
      const reading = await readClaudeUsage((program, args) =>
        zebar.shellExec(program, args)
      );
      if (active) setState(reading);
    };

    poll();
    const timer = setInterval(poll, intervalMs);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [intervalMs]);

  return state;
}
