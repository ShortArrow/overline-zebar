import { useEffect, useState } from 'react';
import { LhmNode } from './lhm';

/** LibreHardwareMonitor's Remote Web Server; zpack.json exempts it from widget caching. */
const LHM_DATA_URL = 'http://localhost:8085/data.json';

export type LhmState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'ok'; data: LhmNode };

/**
 * Polls LibreHardwareMonitor's sensor tree while the component is mounted.
 * Becomes `unavailable` whenever a request fails, e.g. when LHM is not running.
 */
export function useLhmData(intervalMs = 2000): LhmState {
  const [state, setState] = useState<LhmState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    const poll = async () => {
      try {
        const response = await fetch(LHM_DATA_URL, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`LHM responded ${response.status}`);
        setState({ status: 'ok', data: (await response.json()) as LhmNode });
      } catch {
        if (!controller.signal.aborted) setState({ status: 'unavailable' });
      }
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
