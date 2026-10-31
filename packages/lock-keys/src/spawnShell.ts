import { invoke } from '@tauri-apps/api/core';
import * as zebar from 'zebar';
import { LockKeysProcess } from './watchLockKeys';

/**
 * Starts a program through `zebar.shellSpawn`, with `write` and `kill` that
 * actually reach it.
 *
 * Zebar 3.3.1's `ShellProcess.write` and `kill` send the process id as
 * `processId`, but the desktop commands take it as `pid`, so both calls are
 * rejected and never reach the process. These call the commands with `pid`,
 * which keeps working once the client sends the right name.
 *
 * A failed write or kill is dropped: the process is already gone, or stops
 * on its own once its heartbeats stop.
 */
export async function spawnShell(
  program: string,
  args: string[]
): Promise<LockKeysProcess> {
  const process = await zebar.shellSpawn(program, args);
  const pid = process.processId;
  const ignoreFailure = () => {};

  return {
    onStdout: process.onStdout,
    onExit: process.onExit,
    write: (buffer) => {
      invoke('shell_write', { pid, buffer }).catch(ignoreFailure);
    },
    kill: () => {
      invoke('shell_kill', { pid }).catch(ignoreFailure);
    },
  };
}
