import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createInterface } from 'node:readline';
import { describe, expect, it } from 'vitest';
import { LOCK_KEYS_COMMAND } from './command';
import { parseLockState } from './lockKeys';

/** Runs the real script and resolves with its first line of output. */
const start = () => {
  const child = spawn(LOCK_KEYS_COMMAND.program, LOCK_KEYS_COMMAND.args);
  const lines = createInterface({ input: child.stdout });
  const firstLine = once(lines, 'line').then(([line]) => line as string);
  const exited = once(child, 'exit');
  return { child, firstLine, exited };
};

describe.runIf(process.platform === 'win32')('LOCK_KEYS_SCRIPT', () => {
  it('prints the state of every lock once it starts', async () => {
    const { child, firstLine, exited } = start();

    expect(parseLockState(await firstLine)).not.toBeNull();

    child.stdin.end();
    await exited;
  }, 20_000);

  it('exits when its stdin closes', async () => {
    const { child, firstLine, exited } = start();
    await firstLine;

    child.stdin.end();

    expect((await exited)[0]).toBe(0);
  }, 20_000);

  it('exits on its own once the heartbeats stop', async () => {
    const { firstLine, exited } = start();
    await firstLine;

    expect((await exited)[0]).toBe(0);
  }, 20_000);
});
