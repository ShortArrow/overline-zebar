import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CLAUDE_USAGE_COMMAND, CLAUDE_USAGE_SCRIPT } from './command';

type Pack = {
  widgets: {
    name: string;
    privileges: { shellCommands: { program: string; argsRegex: string }[] };
  }[];
};

const pack: Pack = JSON.parse(
  readFileSync(new URL('../../../zpack.json', import.meta.url), 'utf8')
);

/** Mirrors Zebar's check: the args joined by spaces must match a rule's regex. */
const isAllowed = (widget: string, program: string, args: string[]) =>
  pack.widgets
    .find(({ name }) => name === widget)!
    .privileges.shellCommands.some(
      (rule) =>
        rule.program === program &&
        new RegExp(rule.argsRegex).test(args.join(' '))
    );

describe('CLAUDE_USAGE_COMMAND', () => {
  it('passes the script to PowerShell as UTF-16LE base64', () => {
    const encoded = CLAUDE_USAGE_COMMAND.args.at(-1)!;
    const decoded = Buffer.from(encoded, 'base64').toString('utf16le');

    expect(decoded).toBe(CLAUDE_USAGE_SCRIPT);
  });

  it.each(['main', 'system-stats'])(
    'is allowed for the %s widget',
    (widget) => {
      const { program, args } = CLAUDE_USAGE_COMMAND;

      expect(isAllowed(widget, program, args)).toBe(true);
    }
  );

  it.each(['main', 'system-stats'])(
    'lets the %s widget run nothing else through PowerShell',
    (widget) => {
      const { program, args } = CLAUDE_USAGE_COMMAND;

      expect(isAllowed(widget, program, [...args, '-Command', 'x'])).toBe(
        false
      );
      expect(isAllowed(widget, program, ['-Command', 'x', ...args])).toBe(
        false
      );
    }
  );
});
