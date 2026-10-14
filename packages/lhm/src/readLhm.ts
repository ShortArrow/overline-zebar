import { LhmNode } from './lhm';

/** LibreHardwareMonitor's Remote Web Server; zpack.json exempts it from widget caching. */
export const LHM_DATA_URL = 'http://localhost:8085/data.json';

export type LhmReading =
  | { status: 'unavailable' }
  | { status: 'ok'; data: LhmNode };

/**
 * Reads LibreHardwareMonitor's sensor tree once. Any failure, including LHM
 * not running or answering with a non-JSON body, reads as `unavailable`.
 */
export async function readLhm(
  fetchFn: typeof fetch = fetch,
  signal?: AbortSignal
): Promise<LhmReading> {
  try {
    const response = await fetchFn(LHM_DATA_URL, { signal });
    if (!response.ok) return { status: 'unavailable' };
    return { status: 'ok', data: (await response.json()) as LhmNode };
  } catch {
    return { status: 'unavailable' };
  }
}
