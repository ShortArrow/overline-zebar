import type { Threshold } from '@overline-zebar/config';
import { describe, expect, it } from 'vitest';
import { toTemperatureStat } from './temperatureStatView';

const limits = { cpu: 95, gpu: 90, memory: 80 };

const thresholds: Threshold[] = [
  { id: 'warn', min: 50, max: 75, labelColor: '--warning' },
  { id: 'danger', min: 75, max: 100, labelColor: '--danger' },
];

describe('toTemperatureStat', () => {
  it('shows the share of the limit on an unlabelled ring with the thresholds as they are', () => {
    const critical = { kind: 'gpu' as const, celsius: 72, ratio: 0.8 };

    expect(toTemperatureStat(critical, limits, thresholds, false)).toEqual({
      label: null,
      type: 'ring',
      stat: '80%',
      threshold: thresholds,
    });
  });

  it('shows rounded degrees inline with the thresholds scaled to the limit', () => {
    const critical = { kind: 'memory' as const, celsius: 61.6, ratio: 0.77 };

    expect(toTemperatureStat(critical, limits, thresholds, true)).toEqual({
      label: 'RAM',
      type: 'inline',
      stat: '62°C',
      threshold: [
        { id: 'warn', min: 40, max: 60, labelColor: '--warning' },
        { id: 'danger', min: 60, max: 80, labelColor: '--danger' },
      ],
    });
  });
});
