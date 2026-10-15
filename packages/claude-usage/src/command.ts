/**
 * Prints Claude's usage API response using the OAuth token Claude Code keeps
 * signed in. The token never leaves this script; it fails when Claude Code is
 * signed out or its token has expired until Claude Code refreshes it.
 * Claude's API refuses browser origins, so widgets cannot fetch it directly.
 */
export const CLAUDE_USAGE_SCRIPT = [
  "$ErrorActionPreference = 'Stop'",
  "$ProgressPreference = 'SilentlyContinue'",
  "$credentials = Get-Content -Raw (Join-Path $env:USERPROFILE '.claude/.credentials.json') | ConvertFrom-Json",
  '$headers = @{',
  '  Authorization = "Bearer $($credentials.claudeAiOauth.accessToken)"',
  "  'anthropic-beta' = 'oauth-2025-04-20'",
  '}',
  "$response = Invoke-WebRequest -UseBasicParsing -Headers $headers -Uri 'https://api.anthropic.com/api/oauth/usage'",
  '[Console]::Out.Write($response.Content)',
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
