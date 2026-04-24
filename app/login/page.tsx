'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { TrendingUp } from 'lucide-react';
import { login, type AuthState } from '@/app/actions/auth';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(login, null);
  const error = state && 'error' in state ? state.error : null;

  return (
    <div className="min-h-screen bg-agro-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-agro-green p-3 rounded-2xl mb-3 shadow-lg shadow-agro-green/20">
            <TrendingUp size={32} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl text-agro-green tracking-tight">
            AgroCusto
          </h1>
          <p className="text-slate-500 text-sm mt-2">Gestão de custos para o agronegócio</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Entrar</h2>

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-bold text-slate-700 mb-2 block">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="voce@exemplo.com"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-agro-green focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-bold text-slate-700 mb-2 block">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-agro-green focus:border-transparent transition-all"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 p-3 bg-red-50 border border-red-100 rounded-xl">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 bg-agro-green text-white rounded-2xl font-bold shadow-lg shadow-agro-green/20 hover:bg-agro-green/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? 'Entrando...' : 'ENTRAR'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Não tem conta?{' '}
          <Link href="/signup" className="font-bold text-agro-green hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
