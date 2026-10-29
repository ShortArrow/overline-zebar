import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LOCK_KEYS_COMMAND } from './command';
import { LockState } from './lockKeys';
import {
  HEARTBEAT_INTERVAL_MS,
  LockKeysProcess,
  RESTART_DELAY_MS,
  watchLockKeys,
} from './watchLockKeys';

const capsOn: LockState = {
  kana: false,
  caps: true,
  scroll: false,
  num: false,
};

/** A stand-in for the PowerShell process that the test drives by hand. */
function fakeProcess() {
  const stdout: ((line: string) => void)[] = [];
  const exit: ((status: { exitCode: number | null }) => void)[] = [];
  const process = {
    onStdout: (callback: (line: string) => void) => stdout.push(callback),
    onExit: (callback: (status: { exitCode: number | null }) => void) =>
      exit.push(callback),
    write: vi.fn(),
    kill: vi.fn(),
  } satisfies LockKeysProcess;
  return {
    process,
    print: (line: string) => stdout.forEach((callback) => callback(line)),
    exit: () => exit.forEach((callback) => callback({ exitCode: 1 })),
  };
}

describe('watchLockKeys', () => {
  let processes: ReturnType<typeof fakeProcess>[];
  let spawn: ReturnType<typeof vi.fn>;
  let onChange: ReturnType<typeof vi.fn>;
  const first = () => processes[0]!;

  beforeEach(() => {
    vi.useFakeTimers();
    processes = [];
    spawn = vi.fn(async () => {
      const fake = fakeProcess();
      processes.push(fake);
      return fake.process;
    });
    onChange = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts the lock keys command', async () => {
    watchLockKeys(spawn, onChange);
    await vi.runOnlyPendingTimersAsync();

    expect(spawn).toHaveBeenCalledWith(
      LOCK_KEYS_COMMAND.program,
      LOCK_KEYS_COMMAND.args
    );
  });

  it('reports each state the script prints and skips other lines', async () => {
    watchLockKeys(spawn, onChange);
    await vi.advanceTimersByTimeAsync(0);

    first().print('not a state');
    first().print(JSON.stringify(capsOn));

    expect(onChange.mock.calls).toEqual([[capsOn]]);
  });

  it('sends a heartbeat every interval', async () => {
    watchLockKeys(spawn, onChange);
    await vi.advanceTimersByTimeAsync(0);

    await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS * 3);

    expect(first().process.write).toHaveBeenCalledTimes(3);
    expect(first().process.write).toHaveBeenCalledWith('\n');
  });

  it('reports no state and starts again after the script exits', async () => {
    watchLockKeys(spawn, onChange);
    await vi.advanceTimersByTimeAsync(0);
    first().print(JSON.stringify(capsOn));

    first().exit();
    expect(onChange).toHaveBeenLastCalledWith(null);

    await vi.advanceTimersByTimeAsync(RESTART_DELAY_MS);
    expect(spawn).toHaveBeenCalledTimes(2);
  });

  it('tries again later when the command cannot start', async () => {
    spawn.mockRejectedValueOnce(new Error('No shell privileges'));
    watchLockKeys(spawn, onChange);
    await vi.advanceTimersByTimeAsync(0);

    await vi.advanceTimersByTimeAsync(RESTART_DELAY_MS);

    expect(spawn).toHaveBeenCalledTimes(2);
  });

  it('kills the script when stopped and does not start it again', async () => {
    const stop = watchLockKeys(spawn, onChange);
    await vi.advanceTimersByTimeAsync(0);

    stop();
    first().exit();
    await vi.advanceTimersByTimeAsync(RESTART_DELAY_MS * 2);

    expect(first().process.kill).toHaveBeenCalled();
    expect(spawn).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('kills a script that finishes starting after it was stopped', async () => {
    const stop = watchLockKeys(spawn, onChange);

    stop();
    await vi.advanceTimersByTimeAsync(0);

    expect(first().process.kill).toHaveBeenCalled();
  });
});
