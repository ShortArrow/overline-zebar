import type { TemperatureLimits, Threshold } from '@overline-zebar/config';
import {
  CriticalTemperature,
  HardwareKind,
  toCelsiusRanges,
} from '@overline-zebar/lhm';

const LABELS: Record<HardwareKind, string> = {
  cpu: 'CPU',
  gpu: 'GPU',
  memory: 'RAM',
};

export type TemperatureStatView = {
  /** Which hardware it is, shown only inline; the ring carries just an icon. */
  label: string | null;
  type: 'inline' | 'ring';
  stat: string;
  threshold: Threshold[];
};

/**
 * Inline shows rounded degrees against thresholds scaled to that hardware's
 * limit; the ring shows the share of the limit against the thresholds as is.
 */
export function toTemperatureStat(
  critical: CriticalTemperature,
  limits: TemperatureLimits,
  thresholds: Threshold[],
  inline: boolean
): TemperatureStatView {
  return inline
    ? {
        label: LABELS[critical.kind],
        type: 'inline',
        stat: `${Math.round(critical.celsius)}°C`,
        threshold: toCelsiusRanges(thresholds, limits[critical.kind]),
      }
    : {
        label: null,
        type: 'ring',
        stat: `${Math.round(critical.ratio * 100)}%`,
        threshold: thresholds,
      };
}
