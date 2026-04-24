import {
  LayoutDashboard,
  PlusCircle,
  Layers,
  TrendingUp,
  History,
  BarChart3,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavSurface = 'sidebar' | 'bottom' | 'more';
export type NavTab = 'dashboard' | 'launch' | 'fields' | 'quotes' | 'history' | 'reports';

export type NavItem = {
  readonly id: string;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly tab: NavTab;
  readonly surfaces: readonly NavSurface[];
};

export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, tab: 'dashboard', surfaces: ['sidebar', 'bottom'] },
  { id: 'launch', label: 'Lançar', icon: PlusCircle, tab: 'launch', surfaces: ['sidebar', 'bottom'] },
  { id: 'fields', label: 'Talhões', icon: Layers, tab: 'fields', surfaces: ['sidebar', 'bottom'] },
  { id: 'quotes', label: 'Cotações', icon: TrendingUp, tab: 'quotes', surfaces: ['sidebar', 'bottom'] },
  { id: 'history', label: 'Histórico', icon: History, tab: 'history', surfaces: ['sidebar', 'more'] },
  { id: 'reports', label: 'Relatórios', icon: BarChart3, tab: 'reports', surfaces: ['sidebar', 'more'] },
] as const;
