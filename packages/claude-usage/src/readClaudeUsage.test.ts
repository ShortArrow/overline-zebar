import { describe, expect, it } from 'vitest';
import { CLAUDE_USAGE_COMMAND } from './command';
import { readClaudeUsage, ShellExec } from './readClaudeUsage';

const usage = {
  limits: [{ kind: 'session', percent: 42, resets_at: null, scope: null }],
};

const exits =
  (code: number, stdout: string): ShellExec =>
  async () => ({ code, stdout });

const responds = (status: number, body: string | null) =>
  exits(0, JSON.stringify({ status, body }));

describe('readClaudeUsage', () => {
  it('runs the granted command and reads its limits', async () => {
    const calls: unknown[] = [];
    const exec: ShellExec = async (program, args) => {
      calls.push([program, args]);
      return responds(200, JSON.stringify(usage))(program, args);
    };

    expect(await readClaudeUsage(exec)).toEqual({
      status: 'ok',
      limits: [{ kind: 'session', model: null, percent: 42, resetsAt: null }],
    });
    expect(calls).toEqual([
      [CLAUDE_USAGE_COMMAND.program, CLAUDE_USAGE_COMMAND.args],
    ]);
  });

  it.each([401, 403])(
    'is signed out when the API answers %i',
    async (status) => {
      expect(await readClaudeUsage(responds(status, null))).toEqual({
        status: 'unavailable',
        reason: 'signed-out',
      });
    }
  );

  it('is rate limited when the API answers 429', async () => {
    expect(await readClaudeUsage(responds(429, null))).toEqual({
      status: 'unavailable',
      reason: 'rate-limited',
    });
  });

  it('is an error when the API could not be reached', async () => {
    expect(await readClaudeUsage(responds(0, null))).toEqual({
      status: 'unavailable',
      reason: 'error',
    });
  });

  it('is an error when the response body is not JSON', async () => {
    expect(await readClaudeUsage(responds(200, 'oops'))).toEqual({
      status: 'unavailable',
      reason: 'error',
    });
  });

  it('is an error when the script fails', async () => {
    expect(await readClaudeUsage(exits(1, ''))).toEqual({
      status: 'unavailable',
      reason: 'error',
    });
  });

  it('is an error when the output is not JSON', async () => {
    expect(await readClaudeUsage(exits(0, 'oops'))).toEqual({
      status: 'unavailable',
      reason: 'error',
    });
  });

  it('is an error when Zebar refuses to run the command', async () => {
    const refused: ShellExec = async () => {
      throw new Error('No shell privileges found');
    };
    expect(await readClaudeUsage(refused)).toEqual({
      status: 'unavailable',
      reason: 'error',
    });
  });
});
