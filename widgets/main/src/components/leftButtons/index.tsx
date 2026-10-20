import { useWidgetSetting } from '@overline-zebar/config';
import { Button } from '@overline-zebar/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { Columns2, LayoutGrid, Rows2 } from 'lucide-react';
import { useRef } from 'react';
import * as zebar from 'zebar';
import { GlazeWmOutput } from 'zebar';
import { calculateWidgetPlacementFromLeft } from '../../utils/calculateWidgetPlacement';

interface LeftButtonsProps {
  glazewm: GlazeWmOutput | null;
}

export function LeftButtons({ glazewm }: LeftButtonsProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [marginX] = useWidgetSetting('main', 'marginX');

  if (!glazewm) return null;

  const calculatePlacementFromRef = async () => {
    return await calculateWidgetPlacementFromLeft(
      buttonRef,
      {
        width: 400,
        height: 400,
      },
      marginX
    );
  };

  const handleOpenScriptLauncher = async () => {
    const placement = await calculatePlacementFromRef();
    await zebar.startWidget('script-launcher', placement, {});
  };

  return (
    <div className="flex items-center h-full gap-1.5">
      <AnimatePresence>
        {glazewm.isPaused && (
          <motion.div
            key="paused"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            exit={{ opacity: 0 }}
            className="flex items-center h-full"
          >
            <Button
              size="sm"
              onClick={() => glazewm.runCommand('wm-toggle-pause')}
            >
              paused
            </Button>
          </motion.div>
        )}

        {glazewm.bindingModes.map((bindingMode) => (
          <motion.div
            key={bindingMode.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            exit={{ opacity: 0 }}
            className="flex items-center h-full"
          >
            <Button size="sm">
              {bindingMode.displayName ?? bindingMode.name}
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>

      <Button
        size="icon-sm"
        ref={buttonRef}
        className="h-full"
        onClick={handleOpenScriptLauncher}
        title="Script launcher"
        aria-label="Script launcher"
      >
        <LayoutGrid strokeWidth={2.5} className="h-3 w-3" />
      </Button>

      <Button
        size="icon-sm"
        onClick={() => glazewm.runCommand('toggle-tiling-direction')}
        className="h-full"
        title={`Tiling direction: ${glazewm.tilingDirection}`}
        aria-label={`Tiling direction: ${glazewm.tilingDirection}`}
      >
        {glazewm.tilingDirection === 'vertical' ? (
          <Rows2 strokeWidth={2.5} className="h-3 w-3" />
        ) : (
          <Columns2 strokeWidth={2.5} className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}
