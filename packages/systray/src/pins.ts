import type { SystrayIcon } from 'zebar';

type PinnableIcon = Pick<SystrayIcon, 'id' | 'iconHash'>;

/**
 * Whether `icon` is in `pins`.
 *
 * New pins hold the icon's `id`, which survives image changes such as
 * animation frames. Pins saved before that hold the image hash and still
 * match until the icon is unpinned.
 */
export function isPinned(pins: string[], icon: PinnableIcon): boolean {
  return pinIndex(pins, icon) !== -1;
}

/** Position of the earliest pin matching `icon`, or -1 if it is not pinned. */
export function pinIndex(pins: string[], icon: PinnableIcon): number {
  return pins.findIndex((pin) => pin === icon.id || pin === icon.iconHash);
}

/** Unpins `icon` by every key it was pinned with, or pins it by its `id`. */
export function togglePin(pins: string[], icon: PinnableIcon): string[] {
  return isPinned(pins, icon)
    ? pins.filter((pin) => pin !== icon.id && pin !== icon.iconHash)
    : [...pins, icon.id];
}
