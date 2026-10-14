import { Threshold, useWidgetSetting } from '@overline-zebar/config';
import {
  findMostCritical,
  HardwareKind,
  toCelsiusRanges,
  useLhmData,
} from '@overline-zebar/lhm';
import { Thermometer } from 'lucide-react';
import Stat from '../../stat/Stat';

const LABELS: Record<HardwareKind, string> = {
  cpu: 'CPU',
  gpu: 'GPU',
  memory: 'RAM',
};

const REFRESH_INTERVAL_MS = 5000;

/**
 * Shows the hardware closest to its configured temperature limit, coloured by
 * the system stat thresholds as a percentage of that limit. Polls
 * LibreHardwareMonitor only while mounted and renders nothing without a reading.
 */
export default function TemperatureStat({
  inline,
  thresholds,
}: {
  inline: boolean;
  thresholds: Threshold[];
}) {
  const [limits] = useWidgetSetting('main', 'temperatureLimits');
  const lhm = useLhmData(REFRESH_INTERVAL_MS);
  if (lhm.status !== 'ok') return null;

  const critical = findMostCritical(lhm.data, limits);
  if (!critical) return null;

  const Icon = (
    <span className="flex items-center gap-0.5 font-medium text-icon">
      <Thermometer className="size-3.5" aria-hidden="true" />
      {LABELS[critical.kind]}
    </span>
  );

  return inline ? (
    <Stat
      Icon={Icon}
      stat={`${Math.round(critical.celsius)}°C`}
      type="inline"
      threshold={toCelsiusRanges(thresholds, limits[critical.kind])}
    />
  ) : (
    <Stat
      Icon={Icon}
      stat={`${Math.round(critical.ratio * 100)}%`}
      type="ring"
      threshold={thresholds}
    />
  );
}
