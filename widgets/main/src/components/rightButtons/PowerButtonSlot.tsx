import type { MainWidgetSettings } from '@overline-zebar/config';
import type { ReactNode } from 'react';

/**
 * Renders the power button on one end of the bar, and only when the
 * `powerButtonPosition` setting names that end.
 */
export function PowerButtonSlot({
  side,
  position,
  children,
}: {
  side: 'left' | 'right';
  position: MainWidgetSettings['powerButtonPosition'];
  children: ReactNode;
}) {
  return position === side ? <>{children}</> : null;
}
