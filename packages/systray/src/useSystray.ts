import { useEffect, useState } from 'react';
import * as zebar from 'zebar';
import { createSystraySubscriber } from './subscriber';

const subscribe = createSystraySubscriber(() =>
  zebar.createProviderGroup({ systray: { type: 'systray' } })
);

/**
 * Subscribes to the systray provider only while `enabled`.
 *
 * Zebar sends every provider output to every widget window, so one idle
 * subscription anywhere makes all of them receive each icon's image on
 * every tray change; with animated tray icons that is enough to grow every
 * renderer by gigabytes. Subscribe only while the icons are on screen.
 */
export function useSystray(enabled: boolean): zebar.SystrayOutput | null {
  const [systray, setSystray] = useState<zebar.SystrayOutput | null>(null);

  useEffect(() => {
    if (!enabled) {
      setSystray(null);
      return;
    }
    return subscribe(setSystray);
  }, [enabled]);

  return systray;
}
