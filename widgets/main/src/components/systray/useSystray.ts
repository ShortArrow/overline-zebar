import { useEffect, useState } from 'react';
import * as zebar from 'zebar';

let previousStop: Promise<void> = Promise.resolve();

/**
 * Subscribes to the systray provider only while `enabled`, so a hidden tray
 * costs nothing. Some apps animate their tray icons and Zebar's provider can
 * keep their stale copies, so an idle subscription still grows the widget.
 *
 * A new subscription waits for the previous one to stop: both share the same
 * provider hash, and the old instance's async teardown would otherwise
 * deregister the new one.
 */
export function useSystray(enabled: boolean): zebar.SystrayOutput | null {
  const [systray, setSystray] = useState<zebar.SystrayOutput | null>(null);

  useEffect(() => {
    if (!enabled) {
      setSystray(null);
      return;
    }

    let cancelled = false;
    let group: { stopAll(): Promise<void> } | null = null;

    const started = previousStop.then(() => {
      if (cancelled) return;
      const providers = zebar.createProviderGroup({
        systray: { type: 'systray' },
      });
      group = providers;
      const update = () => setSystray(providers.outputMap.systray);
      update();
      providers.onOutput(update);
    });

    return () => {
      cancelled = true;
      previousStop = started.then(() => group?.stopAll());
    };
  }, [enabled]);

  return systray;
}
