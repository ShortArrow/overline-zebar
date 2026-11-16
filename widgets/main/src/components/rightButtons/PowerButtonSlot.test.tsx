import { defaultConfig } from '@overline-zebar/config/src/defaults/default-config';
import { deepMerge } from '@overline-zebar/config/src/utils/deepMerge';
import { MainWidgetSettingsSchema } from '@overline-zebar/config/src/zod-types';
import type { MainWidgetSettings, RootConfig } from '@overline-zebar/config';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PowerButtonSlot } from './PowerButtonSlot';

describe('powerButtonPosition setting', () => {
  it('keeps the button on the right for a saved config that predates the setting', () => {
    const savedMain: Partial<MainWidgetSettings> = {
      ...defaultConfig.widgets.main,
    };
    delete savedMain.powerButtonPosition;
    const saved = {
      ...defaultConfig,
      widgets: { ...defaultConfig.widgets, main: savedMain },
    } as RootConfig;

    const loaded = deepMerge(defaultConfig, saved);

    expect(loaded.widgets.main?.powerButtonPosition).toBe('right');
  });

  it('defaults to right when parsed without a value', () => {
    expect(MainWidgetSettingsSchema.parse({}).powerButtonPosition).toBe(
      'right'
    );
  });

  it('accepts left and hidden, and rejects any other position', () => {
    const parse = (powerButtonPosition: string) =>
      MainWidgetSettingsSchema.safeParse({ powerButtonPosition }).success;

    expect(parse('left')).toBe(true);
    expect(parse('hidden')).toBe(true);
    expect(parse('center')).toBe(false);
  });
});

describe('PowerButtonSlot', () => {
  const render = (
    side: 'left' | 'right',
    position: 'left' | 'right' | 'hidden'
  ) =>
    renderToStaticMarkup(
      <PowerButtonSlot side={side} position={position}>
        <button>power</button>
      </PowerButtonSlot>
    );

  it('shows the button only on the side the setting names', () => {
    expect(render('right', 'right')).toContain('power');
    expect(render('left', 'right')).toBe('');
    expect(render('left', 'left')).toContain('power');
    expect(render('right', 'left')).toBe('');
  });

  it('shows the button on neither side when hidden', () => {
    expect(render('left', 'hidden')).toBe('');
    expect(render('right', 'hidden')).toBe('');
  });
});
