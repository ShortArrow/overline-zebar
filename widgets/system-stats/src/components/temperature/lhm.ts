/** A node of LibreHardwareMonitor's `data.json` sensor tree. */
export type LhmNode = {
  Text: string;
  Children: LhmNode[];
  Type?: string;
  Value?: string;
  HardwareId?: string;
};

export type HardwareKind = keyof typeof HARDWARE;

/**
 * How to recognise each kind of hardware and which of its temperature sensors
 * represent it as a whole, most representative first.
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
  },
} satisfies Record<string, { hardwareId: RegExp; sensors: RegExp[] }>;

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
  const { hardwareId, sensors } = HARDWARE[kind];
  const temperatures = collect(data, (n) =>
    hardwareId.test(n.HardwareId ?? '')
  ).flatMap((hardware) => collect(hardware, (n) => n.Type === 'Temperature'));

  for (const name of sensors) {
    const readings = temperatures
      .filter((s) => name.test(s.Text))
      .map((s) => parseLhmTemperature(s.Value ?? ''))
      .filter((celsius) => celsius !== null);
    if (readings.length > 0) return Math.max(...readings);
  }
  return null;
}

function collect(node: LhmNode, predicate: (n: LhmNode) => boolean): LhmNode[] {
  return [
    ...(predicate(node) ? [node] : []),
    ...node.Children.flatMap((child) => collect(child, predicate)),
  ];
}
