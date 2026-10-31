import { LOCK_KEYS_COMMAND } from './command';
import { LockState, parseLockState } from './lockKeys';

/** How often a heartbeat goes to the script, well inside its timeout. */
export const HEARTBEAT_INTERVAL_MS = 1_000;

/**
 * How long to wait before starting the script again after it exits or fails
 * to start. Each start compiles a type in PowerShell, so it is not instant.
 */
export const RESTART_DELAY_MS = 30_000;

/** The part of `zebar.ShellProcess` this package relies on. */
export type LockKeysProcess = {
  onStdout: (callback: (line: string) => void) => void;
  onExit: (callback: (status: { exitCode: number | null }) => void) => void;
  write: (data: string) => void;
  kill: () => void;
};

/** The part of `zebar.shellSpawn` this package relies on. */
export type ShellSpawn = (
  program: string,
  args: string[]
) => Promise<LockKeysProcess>;

/**
 * Keeps the lock keys script running and reports each state it prints, or
 * `null` while it is not running. Returns a function that stops the script
 * for good.
 */
export function watchLockKeys(
  spawn: ShellSpawn,
  onChange: (state: LockState | null) => void
): () => void {
  let stopped = false;
  let current: LockKeysProcess | undefined;
  let restart: ReturnType<typeof setTimeout> | undefined;

  const scheduleRestart = () => {
    if (!stopped) restart = setTimeout(start, RESTART_DELAY_MS);
  };

  const start = async () => {
    let process: LockKeysProcess;
    try {
      process = await spawn(LOCK_KEYS_COMMAND.program, LOCK_KEYS_COMMAND.args);
    } catch {
      scheduleRestart();
      return;
    }
    if (stopped) {
      process.kill();
      return;
    }

    current = process;
    process.onStdout((line) => {
      const state = parseLockState(line);
      if (state && !stopped) onChange(state);
    });
    process.onExit(() => {
      current = undefined;
      if (stopped) return;
      onChange(null);
      scheduleRestart();
    });
  };

  const heartbeat = setInterval(
    () => current?.write('\n'),
    HEARTBEAT_INTERVAL_MS
  );
  start();

  return () => {
    stopped = true;
    clearInterval(heartbeat);
    clearTimeout(restart);
    current?.kill();
  };
}
