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
 * represents it as a whole, most representative first.
 */
const HARDWARE = {
  cpu: {
    hardwareId: /^\/(amd|intel)cpu\//,
    sensors: [
      'Core (Tctl/Tdie)',
      'Core (Tdie)',
      'Core (Tctl)',
      'CPU Package',
      'Package',
    ],
  },
} satisfies Record<string, { hardwareId: RegExp; sensors: string[] }>;

/**
 * Reads a sensor value such as `"80.8 °C"` as degrees Celsius.
 * Accepts a comma as the decimal separator; returns null when no number is present.
 */
export function parseLhmTemperature(value: string): number | null {
  const match = value.match(/-?\d+(?:[.,]\d+)?/);
  return match ? Number(match[0].replace(',', '.')) : null;
}

/**
 * Finds the representative temperature of the first hardware of the given kind.
 * Readings reported by other hardware (e.g. the motherboard's "CPU Core") are ignored;
 * returns null when no preferred sensor exists or it is unreadable.
 */
export function findTemperature(
  data: LhmNode,
  kind: HardwareKind
): number | null {
  const { hardwareId, sensors } = HARDWARE[kind];
  const hardware = findNode(data, (n) => hardwareId.test(n.HardwareId ?? ''));
  if (!hardware) return null;

  const temperatures = collect(hardware, (n) => n.Type === 'Temperature');
  for (const name of sensors) {
    const sensor = temperatures.find((s) => s.Text === name);
    if (sensor) return parseLhmTemperature(sensor.Value ?? '');
  }
  return null;
}

function findNode(
  node: LhmNode,
  predicate: (n: LhmNode) => boolean
): LhmNode | undefined {
  if (predicate(node)) return node;
  for (const child of node.Children) {
    const found = findNode(child, predicate);
    if (found) return found;
  }
  return undefined;
}

function collect(node: LhmNode, predicate: (n: LhmNode) => boolean): LhmNode[] {
  return [
    ...(predicate(node) ? [node] : []),
    ...node.Children.flatMap((child) => collect(child, predicate)),
  ];
}
