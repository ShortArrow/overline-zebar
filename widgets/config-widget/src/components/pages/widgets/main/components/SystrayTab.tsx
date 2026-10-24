import { useWidgetSetting } from '@overline-zebar/config';
import { isPinned, togglePin, useSystray } from '@overline-zebar/systray';
import {
  FieldDescription,
  FieldInput,
  FieldTitle,
  FormField,
  Input,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipPopup,
  TooltipPortal,
  TooltipPositioner,
  TooltipTrigger,
} from '@overline-zebar/ui';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

function SystrayTab() {
  const icons = useSystray(true)?.icons;
  const [showSystray, setShowSystray] = useWidgetSetting('main', 'showSystray');
  const [pinnedSystrayIcons, setPinnedSystrayIcons] = useWidgetSetting(
    'main',
    'pinnedSystrayIcons'
  );

  const [search, setSearch] = useState('');

  const filteredIcons = useMemo(() => {
    if (!icons) return icons;
    const query = search.trim().toLowerCase();
    if (!query) return icons;
    return icons.filter((i) => i.tooltip.toLowerCase().includes(query));
  }, [icons, search]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <FormField switch>
        <FieldTitle>Show System Tray</FieldTitle>
        <FieldInput>
          <Switch checked={showSystray} onCheckedChange={setShowSystray} />
        </FieldInput>
        <FieldDescription>
          Show the system tray icons in the topbar.
        </FieldDescription>
      </FormField>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="space-y-0.5 mb-4">
          <h1>Pinned Icons</h1>
          <p className="text-text-muted">
            These icons will stay visible in your system tray when it is
            collapsed.
          </p>
          <p className="text-text-muted">
            You can Shift + Click the system tray icons in the topbar to toggle
            between expanded or collapsed.
          </p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-4 -translate-y-1/2 text-text-muted" />
            <Input
              className="pl-9"
              placeholder="Search tray icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={!showSystray}
            />
          </div>
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto rounded-md border border-border bg-background-deeper">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Pinned</TableHead>
                  <TableHead className="w-16">Icon</TableHead>
                  <TableHead>Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIcons?.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <Switch
                        checked={isPinned(pinnedSystrayIcons, i)}
                        onCheckedChange={() =>
                          setPinnedSystrayIcons(
                            togglePin(pinnedSystrayIcons, i)
                          )
                        }
                        disabled={!showSystray}
                      />
                    </TableCell>
                    <TableCell>
                      <img className="h-5 w-5" src={i.iconUrl} alt="" />
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <span className="block truncate" title={i.tooltip}>
                              {i.tooltip}
                            </span>
                          }
                        />
                        <TooltipPortal>
                          <TooltipPositioner>
                            <TooltipPopup>{i.tooltip}</TooltipPopup>
                          </TooltipPositioner>
                        </TooltipPortal>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SystrayTab;
