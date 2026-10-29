import { useEffect, useState } from 'react';
import { LockState } from './lockKeys';
import { spawnShell } from './spawnShell';
import { watchLockKeys } from './watchLockKeys';

/**
 * The state of the toggle keys while the component is mounted, or `null`
 * until the first reading and while the script is not running.
 */
export function useLockKeys(): LockState | null {
  const [state, setState] = useState<LockState | null>(null);

  useEffect(() => watchLockKeys(spawnShell, setState), []);

  return state;
}
