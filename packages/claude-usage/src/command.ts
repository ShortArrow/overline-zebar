/** The file under `$env:TEMP` where the script keeps its last attempt. */
export const CLAUDE_USAGE_CACHE_FILE = 'overline-zebar-claude-usage.json';

/**
 * Prints `{"status": <HTTP status>, "body": <response text or null>}` for
 * Claude's usage API, called with the OAuth token Claude Code keeps signed
 * in. The token never leaves this script. Status 0 means no answer, such as
 * missing credentials or no network.
 *
 * The API rate limits hard, and every widget instance (one bar per monitor,
 * plus system-stats) polls it, so every attempt, failed or not, is cached for
 * five minutes and shared between them.
 *
 * Claude's API refuses browser origins, so widgets cannot fetch it directly.
 */
export const CLAUDE_USAGE_SCRIPT = [
  "$ErrorActionPreference = 'Stop'",
  "$ProgressPreference = 'SilentlyContinue'",
  `$cache = Join-Path $env:TEMP '${CLAUDE_USAGE_CACHE_FILE}'`,
  '$cached = Get-Item -LiteralPath $cache -ErrorAction SilentlyContinue',
  'if ($cached -and $cached.LastWriteTime -gt (Get-Date).AddMinutes(-5)) {',
  '  $output = Get-Content -Raw -LiteralPath $cache',
  '} else {',
  '  try {',
  "    $credentials = Get-Content -Raw (Join-Path $env:USERPROFILE '.claude/.credentials.json') | ConvertFrom-Json",
  '    $headers = @{',
  '      Authorization = "Bearer $($credentials.claudeAiOauth.accessToken)"',
  "      'anthropic-beta' = 'oauth-2025-04-20'",
  '    }',
  "    $response = Invoke-WebRequest -UseBasicParsing -Headers $headers -Uri 'https://api.anthropic.com/api/oauth/usage'",
  '    $entry = @{ status = [int]$response.StatusCode; body = $response.Content }',
  '  } catch {',
  '    $entry = @{ status = [int]$_.Exception.Response.StatusCode; body = $null }',
  '  }',
  '  $output = $entry | ConvertTo-Json -Compress',
  '  try { Set-Content -LiteralPath $cache -Value $output -NoNewline } catch {}',
  '}',
  '[Console]::Out.Write($output)',
].join('\n');

/**
 * The exact invocation zpack.json grants the widgets, so they can run this
 * script and nothing else through PowerShell. Changing the script changes the
 * encoded argument, and command.test.ts fails until zpack.json's `argsRegex`
 * for `powershell` is regenerated to match it exactly.
 */
export const CLAUDE_USAGE_COMMAND = {
  program: 'powershell',
  args: [
    '-NoProfile',
    '-NonInteractive',
    '-EncodedCommand',
    encodePowerShellCommand(CLAUDE_USAGE_SCRIPT),
  ],
};

/** Base64 of the UTF-16LE bytes, the encoding `-EncodedCommand` expects. */
function encodePowerShellCommand(script: string): string {
  const bytes = Array.from(script, (char) => {
    const code = char.charCodeAt(0);
    return String.fromCharCode(code & 0xff, code >> 8);
  }).join('');
  return btoa(bytes);
}
