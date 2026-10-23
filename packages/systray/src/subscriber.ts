import type { SystrayOutput } from 'zebar';

/** The part of a Zebar provider group holding one `systray` provider that a subscriber uses. */
export interface SystrayGroup {
  outputMap: { systray: SystrayOutput | null };
  onOutput(listener: () => void): void;
  stopAll(): Promise<void>;
}

/**
 * Returns a `subscribe` that starts a systray provider group per subscription
 * and stops it on unsubscribe.
 *
 * Every group from one subscriber shares the same provider hash, and an old
 * group's asynchronous stop would otherwise deregister a newer one, so each
 * group starts only once the previous one has stopped. A subscription
 * cancelled before its turn never starts a group.
 */
export function createSystraySubscriber(create: () => SystrayGroup) {
  let previousStop: Promise<void> = Promise.resolve();

  return function subscribe(
    onChange: (systray: SystrayOutput | null) => void
  ): () => void {
    let cancelled = false;
    let group: SystrayGroup | null = null;

    const started = previousStop.then(() => {
      if (cancelled) return;
      const providers = create();
      group = providers;
      const update = () => onChange(providers.outputMap.systray);
      update();
      providers.onOutput(update);
    });

    return () => {
      cancelled = true;
      previousStop = started.then(() => group?.stopAll());
    };
  };
}
