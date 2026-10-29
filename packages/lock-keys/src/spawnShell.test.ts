import { invoke } from '@tauri-apps/api/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as zebar from 'zebar';
import { spawnShell } from './spawnShell';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('zebar', () => ({ shellSpawn: vi.fn() }));

const spawned = {
  processId: 42,
  onStdout: vi.fn(),
  onStderr: vi.fn(),
  onExit: vi.fn(),
  write: vi.fn(),
  kill: vi.fn(),
};

describe('spawnShell', () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset().mockResolvedValue(undefined);
    vi.mocked(zebar.shellSpawn).mockResolvedValue(spawned);
  });

  it('starts the program through Zebar', async () => {
    await spawnShell('powershell', ['-NoProfile']);

    expect(zebar.shellSpawn).toHaveBeenCalledWith('powershell', ['-NoProfile']);
  });

  it('passes output and exit callbacks through to Zebar', async () => {
    const process = await spawnShell('powershell', []);
    const callback = () => {};

    process.onStdout(callback);
    process.onExit(callback);

    expect(spawned.onStdout).toHaveBeenCalledWith(callback);
    expect(spawned.onExit).toHaveBeenCalledWith(callback);
  });

  it('writes to stdin with the argument name Zebar expects', async () => {
    const process = await spawnShell('powershell', []);

    process.write('\n');

    expect(invoke).toHaveBeenCalledWith('shell_write', {
      pid: 42,
      buffer: '\n',
    });
  });

  it('kills with the argument name Zebar expects', async () => {
    const process = await spawnShell('powershell', []);

    process.kill();

    expect(invoke).toHaveBeenCalledWith('shell_kill', { pid: 42 });
  });

  it('does not leave a failed write or kill unhandled', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('process gone'));
    const process = await spawnShell('powershell', []);
    const unhandled = vi.fn();
    globalThis.process.on('unhandledRejection', unhandled);

    process.write('\n');
    process.kill();
    await new Promise((resolve) => setTimeout(resolve, 0));

    globalThis.process.off('unhandledRejection', unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });
});
