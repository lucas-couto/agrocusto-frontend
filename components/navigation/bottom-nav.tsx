'use client';

import { PlusCircle, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from './nav-config';
import type { NavTab } from './nav-config';
import { NavItemButton } from './nav-item';

type BottomNavProps = {
  readonly activeTab: NavTab;
  readonly onTabChange: (tab: NavTab) => void;
  readonly onMoreClick: () => void;
};

const BOTTOM_LEFT_IDS = ['dashboard', 'fields'] as const;
const BOTTOM_RIGHT_IDS = ['quotes'] as const;

export function BottomNav({ activeTab, onTabChange, onMoreClick }: BottomNavProps) {
  const leftItems = BOTTOM_LEFT_IDS.map((id) => NAV_ITEMS.find((n) => n.id === id)!);
  const rightItems = BOTTOM_RIGHT_IDS.map((id) => NAV_ITEMS.find((n) => n.id === id)!);

  const isMoreActive = activeTab === 'history' || activeTab === 'reports';

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden h-16 bg-white border-t border-slate-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-end justify-around h-full px-2">
        {/* Left slots */}
        {leftItems.map((item) => (
          <NavItemButton
            key={item.id}
            item={item}
            isActive={activeTab === item.tab}
            variant="bottom"
            onClick={() => onTabChange(item.tab)}
          />
        ))}

        {/* Center — elevated Lançar */}
        <LaunchButton onClick={() => onTabChange('launch')} />

        {/* Right slots */}
        {rightItems.map((item) => (
          <NavItemButton
            key={item.id}
            item={item}
            isActive={activeTab === item.tab}
            variant="bottom"
            onClick={() => onTabChange(item.tab)}
          />
        ))}

        {/* Mais button */}
        <button
          onClick={onMoreClick}
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 min-w-0',
            isMoreActive ? 'text-agro-green' : 'text-slate-400',
          )}
        >
          <MoreHorizontal size={22} strokeWidth={isMoreActive ? 2.5 : 2} />
          <span
            className={cn(
              'text-[10px] leading-tight tracking-tight',
              isMoreActive ? 'font-bold' : 'font-medium',
            )}
          >
            Mais
          </span>
        </button>
      </div>
    </nav>
  );
}

function LaunchButton({ onClick }: { readonly onClick: () => void }) {
  return (
    <div className="flex flex-col items-center -translate-y-3">
      <button
        onClick={onClick}
        className="w-14 h-14 rounded-full bg-agro-green flex items-center justify-center shadow-xl shadow-agro-green/40"
      >
        <PlusCircle size={28} className="text-white" />
      </button>
      <span className="text-[10px] leading-tight tracking-tight font-medium text-slate-900 mt-0.5">
        Lançar
      </span>
    </div>
  );
}
