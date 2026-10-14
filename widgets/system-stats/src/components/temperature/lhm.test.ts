import { describe, expect, it } from 'vitest';
import { findTemperature, LhmNode, parseLhmTemperature } from './lhm';

function sensor(Text: string, Value: string): LhmNode {
  return { Text, Type: 'Temperature', Value, Children: [] };
}

function hardware(
  Text: string,
  HardwareId: string,
  temperatures: LhmNode[]
): LhmNode {
  return {
    Text,
    HardwareId,
    Children: [{ Text: 'Temperatures', Children: temperatures }],
  };
}

function root(...hardwares: LhmNode[]): LhmNode {
  return {
    Text: 'Sensor',
    Children: [{ Text: 'DESKTOP', Children: hardwares }],
  };
}

const motherboard = hardware('MSI MAG X870E', '/motherboard', [
  sensor('CPU Core', '80.0 °C'),
]);

describe('parseLhmTemperature', () => {
  it.each([
    ['80.8 °C', 80.8],
    ['80,8 °C', 80.8],
    ['-5.0 °C', -5],
    ['42 °C', 42],
  ])('reads %s as %d', (value, expected) => {
    expect(parseLhmTemperature(value)).toBe(expected);
  });

  it.each([[''], ['°C'], ['N/A']])('rejects %j', (value) => {
    expect(parseLhmTemperature(value)).toBeNull();
  });
});

describe("findTemperature(data, 'cpu')", () => {
  it('prefers Tctl/Tdie over Package on AMD and ignores the motherboard', () => {
    const data = root(
      motherboard,
      hardware('AMD Ryzen 9 7950X', '/amdcpu/0', [
        sensor('Package', '76.2 °C'),
        sensor('Core (Tctl/Tdie)', '80.8 °C'),
        sensor('CCD1 (Tdie)', '72.3 °C'),
      ])
    );

    expect(findTemperature(data, 'cpu')).toBe(80.8);
  });

  it('falls back to Package when Tctl/Tdie is absent', () => {
    const data = root(
      hardware('AMD Ryzen 5 3600', '/amdcpu/0', [sensor('Package', '61.5 °C')])
    );

    expect(findTemperature(data, 'cpu')).toBe(61.5);
  });

  it('uses CPU Package on Intel', () => {
    const data = root(
      hardware('Intel Core i7-12700K', '/intelcpu/0', [
        sensor('CPU Core #1', '55.0 °C'),
        sensor('CPU Package', '58.0 °C'),
        sensor('Core Max', '60.0 °C'),
      ])
    );

    expect(findTemperature(data, 'cpu')).toBe(58);
  });

  it('returns null when only the motherboard reports a CPU temperature', () => {
    expect(findTemperature(root(motherboard), 'cpu')).toBeNull();
  });

  it('returns null when the CPU has no known sensor', () => {
    const data = root(
      hardware('Intel Core i7-12700K', '/intelcpu/0', [
        sensor('CPU Core #1', '55.0 °C'),
      ])
    );

    expect(findTemperature(data, 'cpu')).toBeNull();
  });

  it('returns null when the preferred sensor value is unreadable', () => {
    const data = root(
      hardware('AMD Ryzen 9 7950X', '/amdcpu/0', [
        sensor('Core (Tctl/Tdie)', ''),
      ])
    );

    expect(findTemperature(data, 'cpu')).toBeNull();
  });
});

describe("findTemperature(data, 'gpu')", () => {
  const nvidia = hardware('NVIDIA GeForce RTX 3080', '/gpu-nvidia/0', [
    sensor('GPU Core', '41.0 °C'),
    sensor('GPU Hot Spot', '47.2 °C'),
    sensor('GPU Memory Junction', '46.0 °C'),
  ]);
  const integrated = hardware('AMD Radeon(TM) Graphics', '/gpu-amd/0', [
    sensor('GPU VR SoC', '55.0 °C'),
  ]);

  it('prefers GPU Core over hot spot and memory junction', () => {
    expect(findTemperature(root(nvidia), 'gpu')).toBe(41);
  });

  it('skips an integrated GPU without a core sensor listed first', () => {
    expect(findTemperature(root(integrated, nvidia), 'gpu')).toBe(41);
  });

  it('returns null when there is no GPU', () => {
    expect(findTemperature(root(motherboard), 'gpu')).toBeNull();
  });
});

describe("findTemperature(data, 'memory')", () => {
  function dimm(slot: number, celsius: string): LhmNode {
    return hardware(`Micron (#${slot})`, `/memory/dimm/${slot}`, [
      sensor(`DIMM #${slot}`, celsius),
      sensor('Temperature Sensor Resolution', '0.3 °C'),
      sensor('Thermal Sensor High Limit', '55.0 °C'),
      sensor('Thermal Sensor Critical High Limit', '85.0 °C'),
    ]);
  }

  it('reports the hottest DIMM and ignores limit sensors', () => {
    expect(
      findTemperature(root(dimm(1, '42.0 °C'), dimm(3, '44.5 °C')), 'memory')
    ).toBe(44.5);
  });

  it('returns null when no DIMM reports a temperature', () => {
    expect(findTemperature(root(motherboard), 'memory')).toBeNull();
  });
});
