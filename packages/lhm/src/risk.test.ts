import { describe, expect, it } from 'vitest';
import { LhmNode } from './lhm';
import { findMostCritical } from './risk';

function hardware(HardwareId: string, sensors: [string, string][]): LhmNode {
  return {
    Text: HardwareId,
    HardwareId,
    Children: sensors.map(([Text, Value]) => ({
      Text,
      Value,
      Type: 'Temperature',
      Children: [],
    })),
  };
}

const limits = { cpu: 95, gpu: 90, memory: 85 };

describe('findMostCritical', () => {
  it('picks the kind closest to its limit, not the hottest one', () => {
    const data: LhmNode = {
      Text: 'Sensor',
      Children: [
        hardware('/amdcpu/0', [['Core (Tctl/Tdie)', '85.5 °C']]),
        hardware('/gpu-nvidia/0', [['GPU Core', '55.0 °C']]),
        hardware('/memory/dimm/1', [['DIMM #1', '80.0 °C']]),
      ],
    };

    expect(findMostCritical(data, limits)).toEqual({
      kind: 'memory',
      celsius: 80,
      ratio: 80 / 85,
    });
  });

  it('skips kinds without a reading', () => {
    const data: LhmNode = {
      Text: 'Sensor',
      Children: [hardware('/amdcpu/0', [['Core (Tctl/Tdie)', '76.0 °C']])],
    };

    expect(findMostCritical(data, limits)).toEqual({
      kind: 'cpu',
      celsius: 76,
      ratio: 0.8,
    });
  });

  it('returns null when nothing reports a temperature', () => {
    expect(
      findMostCritical({ Text: 'Sensor', Children: [] }, limits)
    ).toBeNull();
  });
});
