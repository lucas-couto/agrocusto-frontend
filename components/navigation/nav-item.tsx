'use client';

import { cn } from '@/lib/utils';
import type { NavItem } from './nav-config';

type NavItemProps = {
  readonly item: NavItem;
  readonly isActive: boolean;
  readonly variant: 'sidebar' | 'bottom';
  readonly onClick: () => void;
};

export function NavItemButton({ item, isActive, variant, onClick }: NavItemProps) {
  const Icon = item.icon;

  if (variant === 'sidebar') {
    return (
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
          isActive
            ? 'bg-agro-green text-white shadow-lg shadow-agro-green/20'
            : 'text-slate-500 hover:bg-slate-50',
        )}
      >
        <Icon size={20} />
        <span className="font-medium">{item.label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 min-w-0',
        isActive ? 'text-agro-green' : 'text-slate-400',
      )}
    >
      <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
      <span
        className={cn(
          'text-[10px] leading-tight tracking-tight',
          isActive ? 'font-bold' : 'font-medium',
        )}
      >
        {item.label}
      </span>
    </button>
  );
}
