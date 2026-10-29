import { LOCK_KEYS, VIRTUAL_KEY_CODES } from './lockKeys';

/**
 * Seconds the script keeps running without a heartbeat on its stdin. Zebar
 * does not stop spawned processes when a widget closes or reloads, so a
 * script whose widget is gone stops itself.
 */
export const HEARTBEAT_TIMEOUT_SECONDS = 5;

const virtualKeys = LOCK_KEYS.map(
  (key) => `${key} = 0x${VIRTUAL_KEY_CODES[key].toString(16)}`
).join('; ');

/**
 * Prints `{"kana":…,"caps":…,"scroll":…,"num":…}` once it starts and again
 * whenever a lock changes, checking every 250 ms. It exits when its stdin
 * closes or no heartbeat has arrived for `HEARTBEAT_TIMEOUT_SECONDS`.
 *
 * Windows PowerShell's `[Console]::In.ReadLineAsync()` blocks, so stdin is
 * read through the raw stream instead.
 */
export const LOCK_KEYS_SCRIPT = [
  "$ErrorActionPreference = 'Stop'",
  "$ProgressPreference = 'SilentlyContinue'",
  `Add-Type -Namespace OverlineZebar -Name LockKeys -MemberDefinition '[DllImport("user32.dll")] public static extern short GetKeyState(int key);'`,
  `$keys = [ordered]@{ ${virtualKeys} }`,
  '$stdin = [Console]::OpenStandardInput()',
  '$buffer = New-Object byte[] 64',
  '$heartbeat = $stdin.ReadAsync($buffer, 0, $buffer.Length)',
  '$lastBeat = [DateTime]::UtcNow',
  "$last = ''",
  `while (([DateTime]::UtcNow - $lastBeat).TotalSeconds -lt ${HEARTBEAT_TIMEOUT_SECONDS}) {`,
  '  if ($heartbeat.IsCompleted) {',
  '    if ($heartbeat.IsFaulted -or $heartbeat.Result -eq 0) { break }',
  '    $lastBeat = [DateTime]::UtcNow',
  '    $heartbeat = $stdin.ReadAsync($buffer, 0, $buffer.Length)',
  '  }',
  '  $state = [ordered]@{}',
  '  foreach ($key in $keys.GetEnumerator()) {',
  '    $state[$key.Key] = ([OverlineZebar.LockKeys]::GetKeyState($key.Value) -band 1) -eq 1',
  '  }',
  '  $line = $state | ConvertTo-Json -Compress',
  '  if ($line -ne $last) {',
  '    [Console]::Out.WriteLine($line)',
  '    $last = $line',
  '  }',
  '  Start-Sleep -Milliseconds 250',
  '}',
].join('\n');

/**
 * The exact invocation zpack.json grants the main widget, so it can run this
 * script and nothing else through PowerShell. Changing the script changes the
 * encoded argument, and command.test.ts fails until zpack.json's `argsRegex`
 * for `powershell` is regenerated to match it exactly.
 */
export const LOCK_KEYS_COMMAND = {
  program: 'powershell',
  args: [
    '-NoProfile',
    '-NonInteractive',
    '-EncodedCommand',
    encodePowerShellCommand(LOCK_KEYS_SCRIPT),
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
