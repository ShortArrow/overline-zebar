import { Threshold, useWidgetSetting } from '@overline-zebar/config';
import { findMostCritical, useLhmData } from '@overline-zebar/lhm';
import { Thermometer } from 'lucide-react';
import Stat from '../../stat/Stat';
import { toTemperatureStat } from './temperatureStatView';

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

  const { label, type, stat, threshold } = toTemperatureStat(
    critical,
    limits,
    thresholds,
    inline
  );

  return (
    <Stat
      Icon={
        <span className="flex items-center gap-0.5 font-medium text-icon">
          <Thermometer
            className="size-3.5"
            aria-hidden={label !== null}
            aria-label={label === null ? 'Temperature' : undefined}
          />
          {label}
        </span>
      }
      stat={stat}
      type={type}
      threshold={threshold}
    />
  );
}
