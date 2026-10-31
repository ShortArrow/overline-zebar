import { describe, expect, it } from 'vitest';
import { activeLockKeys, parseLockState } from './lockKeys';

const allOff = { kana: false, caps: false, scroll: false, num: false };

describe('parseLockState', () => {
  it('reads a line the script prints', () => {
    expect(
      parseLockState('{"kana":true,"caps":false,"scroll":false,"num":true}')
    ).toEqual({ kana: true, caps: false, scroll: false, num: true });
  });

  it('ignores surrounding whitespace such as a carriage return', () => {
    expect(parseLockState(`${JSON.stringify(allOff)}\r`)).toEqual(allOff);
  });

  it.each([
    ['an empty line', ''],
    ['text that is not JSON', 'Add-Type failed'],
    ['a missing key', '{"kana":true,"caps":false,"scroll":false}'],
    ['a value that is not a boolean', '{"kana":1,"caps":0,"scroll":0,"num":0}'],
    ['JSON that is not an object', 'null'],
  ])('rejects %s', (_, line) => {
    expect(parseLockState(line)).toBeNull();
  });
});

describe('activeLockKeys', () => {
  it('lists the locks that are on, kana first', () => {
    expect(
      activeLockKeys({ kana: true, caps: true, scroll: false, num: true })
    ).toEqual(['kana', 'caps', 'num']);
  });

  it('lists nothing when every lock is off', () => {
    expect(activeLockKeys(allOff)).toEqual([]);
  });

  it('lists nothing before the first reading', () => {
    expect(activeLockKeys(null)).toEqual([]);
  });
});
