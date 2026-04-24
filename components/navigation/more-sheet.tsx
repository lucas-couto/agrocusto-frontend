'use client';

import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from './nav-config';
import type { NavTab } from './nav-config';
import { UserFooter } from './user-footer';
import type { Fazenda } from '@/types';

type MoreSheetProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly activeTab: NavTab;
  readonly onTabChange: (tab: NavTab) => void;
  readonly fazendas: Fazenda[];
  readonly activeFazendaId: number;
  readonly onFazendaChange: (id: number) => void;
  readonly isTrial: boolean;
  readonly daysLeft: number;
  readonly onShowSubscription: () => void;
  readonly userName: string;
};

export function MoreSheet({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  fazendas,
  activeFazendaId,
  onFazendaChange,
  isTrial,
  daysLeft,
  onShowSubscription,
  userName,
}: MoreSheetProps) {
  const moreItems = NAV_ITEMS.filter((item) =>
    item.surfaces.includes('more'),
  );

  const handleItemClick = (tab: NavTab) => {
    onTabChange(tab);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm md:hidden"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl md:hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>

            {/* Navigation links */}
            <nav className="px-6 py-2 space-y-1">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.tab;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.tab)}
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
              })}
            </nav>

            {/* User footer */}
            <UserFooter
              fazendas={fazendas}
              activeFazendaId={activeFazendaId}
              onFazendaChange={onFazendaChange}
              isTrial={isTrial}
              daysLeft={daysLeft}
              onShowSubscription={onShowSubscription}
              userName={userName}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
