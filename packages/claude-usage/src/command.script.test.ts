import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { CLAUDE_USAGE_CACHE_FILE, CLAUDE_USAGE_COMMAND } from './command';

/**
 * Runs the real script with TEMP and USERPROFILE pointed at an empty folder,
 * so no Claude credentials are found and nothing reaches the network.
 */
const run = (home: string) =>
  JSON.parse(
    execFileSync(CLAUDE_USAGE_COMMAND.program, CLAUDE_USAGE_COMMAND.args, {
      env: { ...process.env, TEMP: home, USERPROFILE: home },
      encoding: 'utf8',
    })
  );

const cached = { status: 200, body: '{"limits":[]}' };

describe.runIf(process.platform === 'win32')('CLAUDE_USAGE_SCRIPT', () => {
  let home: string;
  let cache: string;

  beforeEach(() => {
    home = mkdtempSync(join(tmpdir(), 'claude-usage-'));
    cache = join(home, CLAUDE_USAGE_CACHE_FILE);
  });

  it('answers from a cache written in the last five minutes', () => {
    writeFileSync(cache, JSON.stringify(cached));

    expect(run(home)).toEqual(cached);
  });

  it('asks again once the cache is older than five minutes', () => {
    writeFileSync(cache, JSON.stringify(cached));
    const sixMinutesAgo = new Date(Date.now() - 6 * 60_000);
    utimesSync(cache, sixMinutesAgo, sixMinutesAgo);

    expect(run(home)).toEqual({ status: 0, body: null });
  });

  it('caches a failed attempt too, so it is not retried at once', () => {
    expect(run(home)).toEqual({ status: 0, body: null });
    expect(JSON.parse(readFileSync(cache, 'utf8').replace(/^﻿/, ''))).toEqual({
      status: 0,
      body: null,
    });
  });
});
