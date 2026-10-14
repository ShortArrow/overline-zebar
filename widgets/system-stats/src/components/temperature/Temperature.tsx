import { Card, CardTitle, PanelLayout } from '@overline-zebar/ui';
import {
  CpuIcon,
  LucideIcon,
  MemoryStick,
  MonitorCog,
  Thermometer,
} from 'lucide-react';
import {
  findTemperature,
  HardwareKind,
  listTemperatures,
  TemperatureReading,
} from './lhm';
import { useLhmData } from './useLhmData';

const ROWS: { kind: HardwareKind; label: string; Icon: LucideIcon }[] = [
  { kind: 'cpu', label: 'CPU', Icon: CpuIcon },
  { kind: 'gpu', label: 'GPU', Icon: MonitorCog },
  { kind: 'memory', label: 'Memory', Icon: MemoryStick },
];

export default function Temperature() {
  const lhm = useLhmData();

  if (lhm.status === 'loading') return null;

  if (lhm.status === 'unavailable') {
    return (
      <PanelLayout className="p-2 px-2.5">
        <div className="flex flex-col justify-center items-center text-center select-text w-full text-text-muted h-full gap-1">
          <p>LibreHardwareMonitor not detected.</p>
          <p>
            Run it as administrator and enable Options &gt; Remote Web Server
            &gt; Run (port 8085).
          </p>
        </div>
      </PanelLayout>
    );
  }

  return (
    <PanelLayout className="p-2 px-2.5 space-y-3">
      {ROWS.map(({ kind, label, Icon }) => {
        const celsius = findTemperature(lhm.data, kind);
        const readings = listTemperatures(lhm.data, kind);
        return (
          <div key={kind}>
            <h3 className="font-medium flex items-center text-text-muted gap-2 mb-1.5">
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </h3>
            <div className="flex gap-2">
              <Card>
                <CardTitle Icon={Thermometer}>Temperature</CardTitle>
                {celsius === null
                  ? 'Not available'
                  : `${celsius.toFixed(1)} °C`}
              </Card>
            </div>
            <Readings readings={readings} />
          </div>
        );
      })}
    </PanelLayout>
  );
}

function Readings({ readings }: { readings: TemperatureReading[] }) {
  if (readings.length === 0) return null;

  return (
    <dl className="grid grid-cols-[1fr_auto] gap-x-3 mt-1.5 px-1 select-text text-text-muted">
      {readings.map(({ label, celsius }) => (
        <div key={label} className="contents">
          <dt className="truncate">{label}</dt>
          <dd className="tabular-nums text-right">{`${celsius.toFixed(1)} °C`}</dd>
        </div>
      ))}
    </dl>
  );
}
