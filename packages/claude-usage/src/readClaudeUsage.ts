import { CLAUDE_USAGE_COMMAND } from './command';
import { ClaudeLimit, parseClaudeUsage } from './usage';

/** The part of `zebar.shellExec` this package relies on. */
export type ShellExec = (
  program: string,
  args: string[]
) => Promise<{ code: number | null; stdout: string }>;

/**
 * Why no limits could be read: Claude Code is signed out or its token has
 * expired, the API is rate limiting, or anything else went wrong.
 */
export type ClaudeUsageProblem = 'signed-out' | 'rate-limited' | 'error';

export type ClaudeUsageReading =
  | { status: 'unavailable'; reason: ClaudeUsageProblem }
  | { status: 'ok'; limits: ClaudeLimit[] };

const unavailable = (reason: ClaudeUsageProblem): ClaudeUsageReading => ({
  status: 'unavailable',
  reason,
});

/** Maps an HTTP status other than 200 to why it gave no limits. */
const problemOf = (httpStatus: number): ClaudeUsageProblem => {
  if (httpStatus === 401 || httpStatus === 403) return 'signed-out';
  if (httpStatus === 429) return 'rate-limited';
  return 'error';
};

/**
 * Reads Claude's plan limits once from the script's
 * `{status, body}` output. Failures that are not an HTTP answer, such as
 * Zebar refusing the command, read as `error`.
 */
export async function readClaudeUsage(
  exec: ShellExec
): Promise<ClaudeUsageReading> {
  try {
    const { code, stdout } = await exec(
      CLAUDE_USAGE_COMMAND.program,
      CLAUDE_USAGE_COMMAND.args
    );
    if (code !== 0) return unavailable('error');
    const { status, body } = JSON.parse(stdout);
    if (status !== 200) return unavailable(problemOf(status));
    return { status: 'ok', limits: parseClaudeUsage(JSON.parse(body)) };
  } catch {
    return unavailable('error');
  }
}
