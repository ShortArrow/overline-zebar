import { describe, expect, it } from 'vitest';
import { CLAUDE_USAGE_COMMAND } from './command';
import { readClaudeUsage, ShellExec } from './readClaudeUsage';

const usage = {
  limits: [{ kind: 'session', percent: 42, resets_at: null, scope: null }],
};

const exits =
  (code: number, stdout: string): ShellExec =>
  async () => ({ code, stdout });

describe('readClaudeUsage', () => {
  it('runs the granted command and reads its limits', async () => {
    const calls: unknown[] = [];
    const exec: ShellExec = async (program, args) => {
      calls.push([program, args]);
      return { code: 0, stdout: JSON.stringify(usage) };
    };

    expect(await readClaudeUsage(exec)).toEqual({
      status: 'ok',
      limits: [{ kind: 'session', model: null, percent: 42, resetsAt: null }],
    });
    expect(calls).toEqual([
      [CLAUDE_USAGE_COMMAND.program, CLAUDE_USAGE_COMMAND.args],
    ]);
  });

  it('is unavailable when the script fails, e.g. signed out', async () => {
    expect(await readClaudeUsage(exits(1, ''))).toEqual({
      status: 'unavailable',
    });
  });

  it('is unavailable when the output is not JSON', async () => {
    expect(await readClaudeUsage(exits(0, 'oops'))).toEqual({
      status: 'unavailable',
    });
  });

  it('is unavailable when Zebar refuses to run the command', async () => {
    const refused: ShellExec = async () => {
      throw new Error('No shell privileges found');
    };
    expect(await readClaudeUsage(refused)).toEqual({ status: 'unavailable' });
  });
});
