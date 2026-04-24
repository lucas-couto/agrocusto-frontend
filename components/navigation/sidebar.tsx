'use client';

import { TrendingUp } from 'lucide-react';
import { NAV_ITEMS } from './nav-config';
import type { NavTab } from './nav-config';
import { NavItemButton } from './nav-item';
import { UserFooter } from './user-footer';
import type { Fazenda } from '@/types';

type SidebarProps = {
  readonly activeTab: NavTab;
  readonly onTabChange: (tab: NavTab) => void;
  readonly fazendas: Fazenda[];
  readonly activeFazendaId: string;
  readonly onFazendaChange: (id: string) => void;
  readonly isTrial: boolean;
  readonly daysLeft: number;
  readonly onShowSubscription: () => void;
  readonly userName: string;
};

export function Sidebar({
  activeTab,
  onTabChange,
  fazendas,
  activeFazendaId,
  onFazendaChange,
  isTrial,
  daysLeft,
  onShowSubscription,
  userName,
}: SidebarProps) {
  const sidebarItems = NAV_ITEMS.filter((item) =>
    item.surfaces.includes('sidebar'),
  );

  return (
    <aside className="hidden md:flex w-72 h-full bg-white border-r border-slate-200 flex-col">
      <SidebarHeader />

      <nav className="flex-1 px-4 py-4 space-y-2">
        {sidebarItems.map((item) => (
          <NavItemButton
            key={item.id}
            item={item}
            isActive={activeTab === item.tab}
            variant="sidebar"
            onClick={() => onTabChange(item.tab)}
          />
        ))}
      </nav>

      <UserFooter
        fazendas={fazendas}
        activeFazendaId={activeFazendaId}
        onFazendaChange={onFazendaChange}
        isTrial={isTrial}
        daysLeft={daysLeft}
        onShowSubscription={onShowSubscription}
        userName={userName}
      />
    </aside>
  );
}

function SidebarHeader() {
  return (
    <div className="p-6 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="bg-agro-green p-2 rounded-xl">
          <TrendingUp size={24} className="text-white" />
        </div>
        <h1 className="font-display font-bold text-2xl text-agro-green tracking-tight">
          AgroCusto
        </h1>
      </div>
    </div>
  );
}
