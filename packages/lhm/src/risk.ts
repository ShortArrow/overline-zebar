import { findTemperature, HardwareKind, LhmNode } from './lhm';

/** Temperature in °C at which each kind of hardware is considered in danger; each must be positive. */
export type TemperatureLimits = Record<HardwareKind, number>;

export type CriticalTemperature = {
  kind: HardwareKind;
  celsius: number;
  /** `celsius / limit`; 1 means the limit is reached and may exceed 1. */
  ratio: number;
};

/**
 * Finds the kind of hardware whose representative temperature is closest to its limit.
 * Kinds without a reading are skipped; returns null when none reports a temperature.
 */
export function findMostCritical(
  data: LhmNode,
  limits: TemperatureLimits
): CriticalTemperature | null {
  const candidates = (Object.keys(limits) as HardwareKind[]).flatMap((kind) => {
    const celsius = findTemperature(data, kind);
    return celsius === null
      ? []
      : [{ kind, celsius, ratio: celsius / limits[kind] }];
  });

  return candidates.reduce<CriticalTemperature | null>(
    (worst, c) => (worst === null || c.ratio > worst.ratio ? c : worst),
    null
  );
}

/** Converts ranges given in percent of a limit into degrees Celsius for that limit. */
export function toCelsiusRanges<T extends { min: number; max: number }>(
  ranges: T[],
  limit: number
): T[] {
  return ranges.map((r) => ({
    ...r,
    min: (r.min * limit) / 100,
    max: (r.max * limit) / 100,
  }));
}
