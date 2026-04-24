'use client';

import Link from 'next/link';
import { Calendar, Info, LogOut } from 'lucide-react';
import { signOut } from '@/app/actions/auth';
import type { Fazenda } from '@/types';

type UserFooterProps = {
  readonly fazendas: Fazenda[];
  readonly activeFazendaId: string;
  readonly onFazendaChange: (id: string) => void;
  readonly isTrial: boolean;
  readonly daysLeft: number;
  readonly onShowSubscription: () => void;
  readonly userName: string;
};

export function UserFooter({
  fazendas,
  activeFazendaId,
  onFazendaChange,
  isTrial,
  daysLeft,
  onShowSubscription,
  userName,
}: UserFooterProps) {
  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="p-6 border-t border-slate-100">
      <TrialBanner
        isTrial={isTrial}
        daysLeft={daysLeft}
        onShowSubscription={onShowSubscription}
      />

      <div className="flex items-center gap-3 px-2">
        <div className="w-10 h-10 rounded-full bg-agro-earth flex items-center justify-center text-white font-bold">
          {initials}
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
          <select
            value={activeFazendaId}
            onChange={(e) => onFazendaChange(e.target.value)}
            className="text-xs text-slate-500 truncate bg-transparent border-none outline-none cursor-pointer w-full p-0"
          >
            {fazendas.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </div>
        <Link
          href={activeFazendaId ? `/fazenda/${activeFazendaId}` : '#'}
          aria-label="Detalhes da fazenda"
          className="p-2 rounded-lg text-slate-400 hover:text-agro-green hover:bg-agro-green/5 transition-colors"
        >
          <Info size={18} />
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            aria-label="Sair"
            className="p-2 rounded-lg text-slate-400 hover:text-agro-green hover:bg-agro-green/5 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------- internal sub-component ---------- */

function TrialBanner({
  isTrial,
  daysLeft,
  onShowSubscription,
}: {
  readonly isTrial: boolean;
  readonly daysLeft: number;
  readonly onShowSubscription: () => void;
}) {
  if (!isTrial) return null;

  return (
    <div
      onClick={onShowSubscription}
      className="bg-amber-50 rounded-2xl p-4 mb-4 border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors"
    >
      <div className="flex items-center gap-2 text-amber-700 mb-1">
        <Calendar size={16} />
        <span className="text-xs font-bold uppercase tracking-wider">
          Período de Teste
        </span>
      </div>
      <p className="text-sm text-amber-800 font-medium">
        {daysLeft} dias restantes
      </p>
      <p className="text-[10px] text-amber-600 mt-1 underline">Assinar agora</p>
    </div>
  );
}
