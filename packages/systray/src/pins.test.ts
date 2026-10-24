import { describe, expect, it } from 'vitest';
import { isPinned, pinIndex, togglePin } from './pins';

const parrot = { id: '1234:1', iconHash: 'frame-a' };

describe('isPinned', () => {
  it('matches an icon pinned by its id whatever its image', () => {
    expect(isPinned(['1234:1'], { ...parrot, iconHash: 'frame-b' })).toBe(true);
  });

  it('matches an icon pinned by its image hash', () => {
    expect(isPinned(['frame-a'], parrot)).toBe(true);
  });

  it('does not match other icons', () => {
    expect(isPinned(['5678:1', 'frame-z'], parrot)).toBe(false);
  });
});

describe('pinIndex', () => {
  it('gives the position of the earliest matching pin', () => {
    expect(pinIndex(['other', 'frame-a', '1234:1'], parrot)).toBe(1);
  });

  it('is -1 for an icon that is not pinned', () => {
    expect(pinIndex(['other'], parrot)).toBe(-1);
  });
});

describe('togglePin', () => {
  it('pins an icon by its id at the end', () => {
    expect(togglePin(['other'], parrot)).toEqual(['other', '1234:1']);
  });

  it('unpins an icon pinned by its id', () => {
    expect(togglePin(['1234:1', 'other'], parrot)).toEqual(['other']);
  });

  it('unpins an icon pinned by its image hash', () => {
    expect(togglePin(['frame-a', 'other'], parrot)).toEqual(['other']);
  });
});
