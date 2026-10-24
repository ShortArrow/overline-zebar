import { useState } from 'react';
import { SystrayIcon, SystrayOutput } from 'zebar';
import { ExpandingCarousel } from './components/ExpandingCarousel';
import { SystrayItem } from './components/SystrayItem';
import { useWidgetSetting } from '@overline-zebar/config';
import { isPinned, pinIndex } from '@overline-zebar/systray';

type SystrayProps = {
  systray: SystrayOutput | null;
};

function arrangeIconsWithPinnedCenter(pins: string[], icons: SystrayIcon[]) {
  const pinned = icons
    .filter((icon) => isPinned(pins, icon))
    .sort((a, b) => pinIndex(pins, a) - pinIndex(pins, b));

  const others = icons
    .filter((icon) => !isPinned(pins, icon))
    .sort((a, b) => a.tooltip.localeCompare(b.tooltip));

  const half = Math.ceil(others.length / 2);
  return [...others.slice(0, half), ...pinned, ...others.slice(half)];
}

export default function Systray({ systray }: SystrayProps) {
  const [expanded, setExpanded] = useState(false);
  const [pinnedSystrayIcons] = useWidgetSetting('main', 'pinnedSystrayIcons');

  if (!systray) return;
  const icons = systray.icons;

  // Toggle icon expansion on Shift+Click
  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      e.preventDefault();
      setExpanded(!expanded);
    }
  };

  // Determine the actual pinned icons that are present in the systray
  const presentPinnedIcons = icons.filter((icon) =>
    isPinned(pinnedSystrayIcons, icon)
  );
  const presentPinnedIconsCount = presentPinnedIcons.length;

  // Set a default of 4 visible icons, but expand if there are more pinned icons.
  const visibleCount = Math.max(4, presentPinnedIconsCount);

  const arrangedIcons = arrangeIconsWithPinnedCenter(pinnedSystrayIcons, icons);

  const unpinnedCount = icons.length - presentPinnedIconsCount;
  const firstPinnedIndex = Math.ceil(unpinnedCount / 2);

  let startIndex;
  if (presentPinnedIconsCount > 0) {
    startIndex = Math.floor(
      firstPinnedIndex - (visibleCount - presentPinnedIconsCount) / 2
    );
  }

  const systrayIcons = arrangedIcons.map((item) => (
    <SystrayItem key={item.id} systray={systray} icon={item} />
  ));

  return (
    <div className="flex items-center gap-1.5" onClick={handleClick}>
      <ExpandingCarousel
        items={systrayIcons}
        expanded={expanded}
        gap={4}
        itemWidth={16}
        visibleCount={visibleCount}
        startIndex={startIndex}
      />
    </div>
  );
}
