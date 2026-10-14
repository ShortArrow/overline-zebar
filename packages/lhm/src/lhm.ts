/** A node of LibreHardwareMonitor's `data.json` sensor tree. */
export type LhmNode = {
  Text: string;
  Children: LhmNode[];
  Type?: string;
  Value?: string;
  HardwareId?: string;
};

export type HardwareKind = keyof typeof HARDWARE;

export type TemperatureReading = { label: string; celsius: number };

type HardwareSpec = {
  hardwareId: RegExp;
  sensors: RegExp[];
  averaged?: RegExp;
};

/**
 * How to recognise each kind of hardware, which of its temperature sensors
 * represent it as a whole (most representative first), and which sensors are
 * alike enough to be averaged.
 */
const HARDWARE = {
  cpu: {
    hardwareId: /^\/(amd|intel)cpu\//,
    sensors: [
      /^Core \((Tctl\/Tdie|Tdie|Tctl)\)$/,
      /^CPU Package$/,
      /^Package$/,
    ],
  },
  gpu: {
    hardwareId: /^\/gpu-/,
    sensors: [/^GPU Core$/, /^GPU Hot Spot$/],
  },
  memory: {
    hardwareId: /^\/memory\/dimm\//,
    sensors: [/^DIMM #\d+$/],
    averaged: /^DIMM #\d+$/,
  },
} satisfies Record<string, HardwareSpec>;

/** Sensors that describe the hardware's thresholds rather than a measurement. */
const NON_MEASUREMENT = /Limit|Resolution|Warning|Critical/;

/**
 * Reads a sensor value such as `"80.8 °C"` as degrees Celsius.
 * Accepts a comma as the decimal separator; returns null when no number is present.
 */
export function parseLhmTemperature(value: string): number | null {
  const match = value.match(/-?\d+(?:[.,]\d+)?/);
  return match ? Number(match[0].replace(',', '.')) : null;
}

/**
 * Finds the hottest reading among all hardware of the given kind, using the
 * most representative sensor name that any of them reports.
 * Readings reported by other hardware (e.g. the motherboard's "CPU Core") are ignored;
 * returns null when no preferred sensor exists or none is readable.
 */
export function findTemperature(
  data: LhmNode,
  kind: HardwareKind
): number | null {
  const temperatures = hardwareOf(data, kind).flatMap(temperatureSensors);

  for (const name of HARDWARE[kind].sensors) {
    const readings = temperatures
      .filter((s) => name.test(s.Text))
      .map((s) => parseLhmTemperature(s.Value ?? ''))
      .filter((celsius) => celsius !== null);
    if (readings.length > 0) return Math.max(...readings);
  }
  return null;
}

/**
 * Lists every measured temperature of the given kind of hardware in reported order,
 * followed by an "Average" when two or more sensors can be meaningfully averaged.
 * A label carries its hardware name when another device reports a sensor of the same name.
 */
export function listTemperatures(
  data: LhmNode,
  kind: HardwareKind
): TemperatureReading[] {
  const devices = hardwareOf(data, kind).map((hardware) => ({
    hardware,
    readings: readSensors(hardware),
  }));
  const shared = sharedLabels(devices.map(({ readings }) => readings));

  const readings = devices.flatMap(({ hardware, readings }) =>
    readings.map(({ label, celsius }) => ({
      label: shared.has(label) ? `${hardware.Text} · ${label}` : label,
      celsius,
    }))
  );
  return [...readings, ...average(devices, HARDWARE[kind])];
}

function sharedLabels(perDevice: TemperatureReading[][]): Set<string> {
  const seen = new Set<string>();
  const shared = new Set<string>();
  for (const labels of perDevice.map((r) => new Set(r.map((x) => x.label)))) {
    for (const label of labels) (seen.has(label) ? shared : seen).add(label);
  }
  return shared;
}

function average(
  devices: { readings: TemperatureReading[] }[],
  spec: HardwareSpec
): TemperatureReading[] {
  const { averaged } = spec;
  if (!averaged) return [];
  const values = devices
    .flatMap(({ readings }) => readings)
    .filter(({ label }) => averaged.test(label))
    .map(({ celsius }) => celsius);
  if (values.length < 2) return [];
  const sum = values.reduce((a, b) => a + b, 0);
  return [{ label: 'Average', celsius: sum / values.length }];
}

function readSensors(hardware: LhmNode): TemperatureReading[] {
  return temperatureSensors(hardware)
    .filter((s) => !NON_MEASUREMENT.test(s.Text))
    .map((s) => ({
      label: s.Text,
      celsius: parseLhmTemperature(s.Value ?? ''),
    }))
    .filter((r): r is TemperatureReading => r.celsius !== null);
}

function hardwareOf(data: LhmNode, kind: HardwareKind): LhmNode[] {
  const { hardwareId } = HARDWARE[kind];
  return collect(data, (n) => hardwareId.test(n.HardwareId ?? ''));
}

function temperatureSensors(hardware: LhmNode): LhmNode[] {
  return collect(hardware, (n) => n.Type === 'Temperature');
}

function collect(node: LhmNode, predicate: (n: LhmNode) => boolean): LhmNode[] {
  return [
    ...(predicate(node) ? [node] : []),
    ...node.Children.flatMap((child) => collect(child, predicate)),
  ];
}
