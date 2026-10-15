import { CLAUDE_USAGE_COMMAND } from './command';
import { ClaudeLimit, parseClaudeUsage } from './usage';

/** The part of `zebar.shellExec` this package relies on. */
export type ShellExec = (
  program: string,
  args: string[]
) => Promise<{ code: number | null; stdout: string }>;

export type ClaudeUsageReading =
  | { status: 'unavailable' }
  | { status: 'ok'; limits: ClaudeLimit[] };

/**
 * Reads Claude's plan limits once. Any failure, such as Claude Code being
 * signed out or Zebar refusing the command, reads as `unavailable`.
 */
export async function readClaudeUsage(
  exec: ShellExec
): Promise<ClaudeUsageReading> {
  try {
    const { code, stdout } = await exec(
      CLAUDE_USAGE_COMMAND.program,
      CLAUDE_USAGE_COMMAND.args
    );
    if (code !== 0) return { status: 'unavailable' };
    return { status: 'ok', limits: parseClaudeUsage(JSON.parse(stdout)) };
  } catch {
    return { status: 'unavailable' };
  }
}
