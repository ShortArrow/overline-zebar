import { NavbarItem, Navbar as UiNavbar } from '@overline-zebar/ui';
import {
  BarChart,
  Globe,
  HardDrive,
  Server,
  Sparkle,
  Thermometer,
} from 'lucide-react';
import { useLocation } from 'wouter';

export default function Navbar() {
  const [location, navigate] = useLocation();

  return (
    <UiNavbar className="rounded-none">
      <NavbarItem
        Icon={Server}
        title="Host"
        href="/"
        location={location}
        navigate={navigate}
      />
      <NavbarItem
        Icon={HardDrive}
        title="Storage"
        href="/storage"
        location={location}
        navigate={navigate}
      />
      <NavbarItem
        Icon={BarChart}
        title="Performance"
        href="/performance"
        location={location}
        navigate={navigate}
      />
      <NavbarItem
        Icon={Globe}
        title="Network"
        href="/network"
        location={location}
        navigate={navigate}
      />
      <NavbarItem
        Icon={Thermometer}
        title="Temperature"
        href="/temperature"
        location={location}
        navigate={navigate}
      />
      <NavbarItem
        Icon={Sparkle}
        title="Claude"
        href="/claude"
        location={location}
        navigate={navigate}
      />
    </UiNavbar>
  );
}
