import { useEffect, useState } from 'react';
import { LhmReading, readLhm } from './readLhm';

export type LhmState = { status: 'loading' } | LhmReading;

/**
 * Polls LibreHardwareMonitor's sensor tree while the component is mounted.
 * Becomes `unavailable` whenever a request fails, e.g. when LHM is not running.
 */
export function useLhmData(intervalMs = 2000): LhmState {
  const [state, setState] = useState<LhmState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    const poll = async () => {
      const reading = await readLhm(fetch, controller.signal);
      if (!controller.signal.aborted) setState(reading);
    };

    poll();
    const timer = setInterval(poll, intervalMs);
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, [intervalMs]);

  return state;
}
