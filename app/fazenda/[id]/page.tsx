'use client';

import React, { useState, useEffect, useMemo, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Layers,
  Wallet,
  DollarSign,
  TrendingUp,
  Pencil,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { categoriaToLabel } from '@/lib/categoria';
import { Sidebar, BottomNav, MoreSheet } from '@/components/navigation';
import type { Fazenda, Talhao, Lancamento, CategoriaLancamento } from '@/types';

// ---------------------------------------------------------------------------
// Shared Card (same as page.tsx)
// ---------------------------------------------------------------------------

function Card({
  children,
  className,
  ...props
}: {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly [key: string]: unknown;
}) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl p-5 shadow-sm border border-slate-100',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatCard (visual match with page.tsx)
// ---------------------------------------------------------------------------

function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  colorClass,
}: {
  readonly title: string;
  readonly value: string;
  readonly subValue?: string;
  readonly icon: React.ComponentType<{ size: number; className?: string }>;
  readonly colorClass: string;
}) {
  return (
    <Card className="flex flex-col gap-1">
      <div className="flex justify-between items-start">
        <div className={cn('p-2 rounded-xl', colorClass)}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      <p className="text-slate-500 text-sm mt-3">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      {subValue && <p className="text-xs text-slate-400">{subValue}</p>}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// InlineEditField
// ---------------------------------------------------------------------------

type InlineEditFieldProps = {
  readonly value: string;
  readonly onSave: (next: string) => Promise<void>;
  readonly tag?: 'h1' | 'p';
  readonly displayClassName?: string;
  readonly inputType?: 'text' | 'number';
  readonly placeholder?: string;
};

function InlineEditField({
  value,
  onSave,
  tag = 'p',
  displayClassName = '',
  inputType = 'text',
  placeholder = '',
}: InlineEditFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function handleSave() {
    if (draft === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch {
      setDraft(value);
      setEditing(false);
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setDraft(value);
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type={inputType}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={saving}
          placeholder={placeholder}
          step={inputType === 'number' ? 'any' : undefined}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-agro-green text-slate-900 font-medium disabled:opacity-50"
        />
        {saving && <Loader2 size={16} className="animate-spin text-agro-green" />}
      </div>
    );
  }

  const Tag = tag;
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="group flex items-center gap-2 text-left w-full"
    >
      <Tag className={cn(displayClassName, 'truncate')}>
        {value || <span className="text-slate-300 italic">{placeholder}</span>}
      </Tag>
      <Pencil
        size={14}
        className="shrink-0 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// DeleteConfirmationModal
// ---------------------------------------------------------------------------

function DeleteConfirmationModal({
  fazendaNome,
  talhoesCount,
  lancamentosCount,
  onConfirm,
  onCancel,
}: {
  readonly fazendaNome: string;
  readonly talhoesCount: number;
  readonly lancamentosCount: number;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}) {
  const [typed, setTyped] = useState('');
  const isMatch = typed === fazendaNome;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
        >
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle size={24} />
            <h3 className="text-lg font-bold">Confirmar exclusao</h3>
          </div>

          <p className="text-sm text-slate-600">
            Esta acao e irreversivel. Voce perdera permanentemente{' '}
            <strong>{talhoesCount} talhoes</strong> e{' '}
            <strong>{lancamentosCount} lancamentos</strong> associados a esta
            fazenda.
          </p>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              Digite <span className="text-red-600">{fazendaNome}</span> para
              confirmar
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-400"
              placeholder={fazendaNome}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm"
            >
              CANCELAR
            </button>
            <button
              type="button"
              disabled={!isMatch}
              onClick={onConfirm}
              className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-600/20"
            >
              DELETAR PERMANENTEMENTE
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function FazendaDetailPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // ---------- global data for nav components ----------
  const [fazendas, setFazendas] = useState<Fazenda[]>([]);
  const [allTalhoes, setAllTalhoes] = useState<Talhao[]>([]);
  const [allLancamentos, setAllLancamentos] = useState<Lancamento[]>([]);
  const [activeFazendaId, setActiveFazendaId] = useState<string>('');
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [isTrial, setIsTrial] = useState(true);
  const [daysLeft, setDaysLeft] = useState(7);
  const [showSubscription, setShowSubscription] = useState(false);

  // ---------- page-specific data ----------
  const [fazenda, setFazenda] = useState<Fazenda | null>(null);
  const [talhoes, setTalhoes] = useState<Talhao[]>([]);
  const [recentLancamentos, setRecentLancamentos] = useState<Lancamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ---------- fetch ----------
  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch fazenda detail + global data in parallel
      const [fazendaRes, allFazendasRes, allTalhoesRes, allLancamentosRes] =
        await Promise.all([
          supabase.from('fazendas').select('*').eq('id', id).single(),
          supabase.from('fazendas').select('*').order('nome'),
          supabase.from('talhoes').select('*').order('nome'),
          supabase
            .from('lancamentos')
            .select('*')
            .order('data_gasto', { ascending: false }),
        ]);

      // Handle 404
      if (fazendaRes.error || !fazendaRes.data) {
        setNotFound(true);
        setIsLoading(false);
        // Still load nav data
        setFazendas(allFazendasRes.data ?? []);
        setAllTalhoes(allTalhoesRes.data ?? []);
        setAllLancamentos(allLancamentosRes.data ?? []);
        if ((allFazendasRes.data ?? []).length > 0) {
          setActiveFazendaId(allFazendasRes.data![0].id);
        }
        return;
      }

      const currentFazenda = fazendaRes.data as Fazenda;
      setFazenda(currentFazenda);

      const fazendaRows = (allFazendasRes.data ?? []) as Fazenda[];
      const talhaoRows = (allTalhoesRes.data ?? []) as Talhao[];
      const lancamentoRows = (allLancamentosRes.data ?? []) as Lancamento[];

      setFazendas(fazendaRows);
      setActiveFazendaId(currentFazenda.id);
      setAllTalhoes(talhaoRows);
      setAllLancamentos(lancamentoRows);

      // Filter talhoes for this fazenda
      const fazendaTalhoes = talhaoRows.filter(
        (t) => t.fazenda_id === currentFazenda.id,
      );
      setTalhoes(fazendaTalhoes);

      // Fetch recent lancamentos for this fazenda's talhoes
      const talhaoIds = fazendaTalhoes.map((t) => t.id);
      if (talhaoIds.length > 0) {
        const lancRes = await supabase
          .from('lancamentos')
          .select('*')
          .in('talhao_id', talhaoIds)
          .order('data_gasto', { ascending: false })
          .limit(10);
        setRecentLancamentos((lancRes.data ?? []) as Lancamento[]);
      }

      setIsLoading(false);
    }
    load();
  }, [supabase, id]);

  // ---------- computed stats ----------
  const totalArea = fazenda?.hectares_totais ?? 0;
  const talhoesCount = talhoes.length;

  const costSafra = useMemo(() => {
    const talhaoIds = new Set(talhoes.map((t) => t.id));
    return allLancamentos
      .filter((l) => l.talhao_id && talhaoIds.has(l.talhao_id))
      .reduce((acc, l) => acc + l.valor_total, 0);
  }, [talhoes, allLancamentos]);

  const estimatedRevenue = useMemo(() => {
    return talhoes.reduce((acc, t) => acc + t.area_ha * 2500, 0);
  }, [talhoes]);

  const mappedArea = useMemo(
    () => talhoes.reduce((acc, t) => acc + t.area_ha, 0),
    [talhoes],
  );
  const pctMapped = totalArea > 0 ? (mappedArea / totalArea) * 100 : 0;

  // Cost per talhao (for table)
  const costByTalhao = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of talhoes) {
      map.set(t.id, 0);
    }
    for (const l of allLancamentos) {
      if (l.talhao_id && map.has(l.talhao_id)) {
        map.set(l.talhao_id, (map.get(l.talhao_id) ?? 0) + l.valor_total);
      }
    }
    return map;
  }, [talhoes, allLancamentos]);

  // lancamentos count for delete warning
  const fazendaLancamentosCount = useMemo(() => {
    const talhaoIds = new Set(talhoes.map((t) => t.id));
    return allLancamentos.filter(
      (l) => l.talhao_id && talhaoIds.has(l.talhao_id),
    ).length;
  }, [talhoes, allLancamentos]);

  // ---------- inline edit handlers ----------
  async function handleUpdateField(field: keyof Fazenda, rawValue: string) {
    if (!fazenda) return;

    let updatePayload: {
      nome?: string;
      localizacao?: string;
      hectares_totais?: number;
    } = {};

    if (field === 'nome') {
      updatePayload = { nome: rawValue };
    } else if (field === 'localizacao') {
      updatePayload = { localizacao: rawValue };
    } else if (field === 'hectares_totais') {
      const nextTotal = parseFloat(rawValue);
      if (isNaN(nextTotal) || nextTotal <= 0) {
        alert('Informe uma area total maior que zero.');
        return;
      }
      if (nextTotal < mappedArea) {
        const ok = window.confirm(
          `A soma dos talhoes (${mappedArea.toFixed(2)} ha) e maior que o novo total (${nextTotal.toFixed(2)} ha). Deseja salvar mesmo assim?`,
        );
        if (!ok) return;
      }
      updatePayload = { hectares_totais: nextTotal };
    }

    const { data, error } = await supabase
      .from('fazendas')
      .update(updatePayload)
      .eq('id', fazenda.id)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      const updated = data as Fazenda;
      setFazenda(updated);
      setFazendas((prev) =>
        prev.map((f) => (f.id === updated.id ? updated : f)),
      );
    }
  }

  // ---------- delete handler ----------
  async function handleDelete() {
    if (!fazenda) return;
    setIsDeleting(true);

    const { error } = await supabase
      .from('fazendas')
      .delete()
      .eq('id', fazenda.id);

    if (error) {
      setIsDeleting(false);
      alert('Erro ao deletar fazenda: ' + error.message);
      return;
    }

    router.push('/');
  }

  // ---------- render ----------
  return (
    <div className="min-h-screen bg-agro-bg flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-agro-green text-white p-4 flex items-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-white p-1.5 rounded-lg">
            <TrendingUp size={20} className="text-agro-green" />
          </div>
          <h1 className="font-display font-bold text-xl tracking-tight">
            AgroCusto
          </h1>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <Sidebar
        activeTab="dashboard"
        onTabChange={() => router.push('/')}
        fazendas={fazendas}
        activeFazendaId={activeFazendaId}
        onFazendaChange={setActiveFazendaId}
        isTrial={isTrial}
        daysLeft={daysLeft}
        onShowSubscription={() => setShowSubscription(true)}
        userName="João Produtor"
      />

      {/* Mobile Bottom Nav */}
      <BottomNav
        activeTab="dashboard"
        onTabChange={() => router.push('/')}
        onMoreClick={() => setIsMoreSheetOpen(true)}
      />

      {/* Mobile More Sheet */}
      <MoreSheet
        isOpen={isMoreSheetOpen}
        onClose={() => setIsMoreSheetOpen(false)}
        activeTab="dashboard"
        onTabChange={() => router.push('/')}
        fazendas={fazendas}
        activeFazendaId={activeFazendaId}
        onFazendaChange={setActiveFazendaId}
        isTrial={isTrial}
        daysLeft={daysLeft}
        onShowSubscription={() => setShowSubscription(true)}
        userName="João Produtor"
      />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-20 md:pb-8 max-w-5xl mx-auto space-y-6">
        {isLoading && (
          <div className="flex items-center justify-center mt-20">
            <Loader2 size={32} className="animate-spin text-agro-green" />
          </div>
        )}

        {!isLoading && notFound && (
          <div className="max-w-md mx-auto mt-20 text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Fazenda nao encontrada
            </h2>
            <p className="text-slate-500">
              A fazenda solicitada nao existe ou voce nao tem permissao para
              acessa-la.
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-agro-green text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-agro-green/20 hover:bg-agro-green/90 transition-all"
            >
              VOLTAR
            </button>
          </div>
        )}

        {!isLoading && !notFound && fazenda && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Back Button */}
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-slate-500 hover:text-agro-green transition-colors font-medium text-sm"
            >
              <ArrowLeft size={18} />
              Voltar ao Dashboard
            </button>

            {/* Header Card */}
            <HeaderCard
              fazenda={fazenda}
              onUpdateField={handleUpdateField}
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="flex flex-col gap-1">
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded-xl bg-agro-green">
                    <MapPin size={20} className="text-white" />
                  </div>
                </div>
                <p className="text-slate-500 text-sm mt-3">Area total</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {totalArea.toFixed(2)} ha
                </h3>
                {totalArea > 0 && (
                  <>
                    <p
                      className={cn(
                        'text-xs mt-1 font-medium',
                        pctMapped > 100
                          ? 'text-red-600'
                          : pctMapped > 80
                            ? 'text-amber-600'
                            : 'text-slate-400',
                      )}
                    >
                      {mappedArea.toFixed(2)} ha mapeados ({pctMapped.toFixed(0)}%)
                    </p>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          pctMapped > 100
                            ? 'bg-red-500'
                            : pctMapped > 80
                              ? 'bg-amber-500'
                              : 'bg-agro-green',
                        )}
                        style={{ width: `${Math.min(pctMapped, 100)}%` }}
                      />
                    </div>
                  </>
                )}
              </Card>
              <StatCard
                title="N. Talhoes"
                value={String(talhoesCount)}
                icon={Layers}
                colorClass="bg-agro-earth"
              />
              <StatCard
                title="Custo da Safra"
                value={`R$ ${costSafra.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={Wallet}
                colorClass="bg-red-500"
              />
              <StatCard
                title="Receita Estimada"
                value={`R$ ${estimatedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                subValue="Baseado em R$ 2.500/ha"
                icon={DollarSign}
                colorClass="bg-agro-gold"
              />
            </div>

            {/* Talhoes Table */}
            <TalhoesTable talhoes={talhoes} costByTalhao={costByTalhao} />

            {/* Recent Lancamentos */}
            <RecentLancamentosSection
              lancamentos={recentLancamentos}
              talhoes={talhoes}
            />

            {/* Danger Zone */}
            <DangerZone
              talhoesCount={talhoesCount}
              lancamentosCount={fazendaLancamentosCount}
              onDelete={() => setShowDeleteModal(true)}
            />
          </motion.div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && fazenda && (
        <DeleteConfirmationModal
          fazendaNome={fazenda.nome}
          talhoesCount={talhoesCount}
          lancamentosCount={fazendaLancamentosCount}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// HeaderCard
// ---------------------------------------------------------------------------

function HeaderCard({
  fazenda,
  onUpdateField,
}: {
  readonly fazenda: Fazenda;
  readonly onUpdateField: (field: keyof Fazenda, value: string) => Promise<void>;
}) {
  return (
    <Card className="space-y-3">
      <div className="flex items-start gap-4">
        <div className="bg-agro-green/10 p-3 rounded-2xl text-agro-green shrink-0">
          <MapPin size={28} />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <InlineEditField
            value={fazenda.nome}
            onSave={(v) => onUpdateField('nome', v)}
            tag="h1"
            displayClassName="text-2xl font-bold text-slate-900"
            placeholder="Nome da fazenda"
          />
          <InlineEditField
            value={fazenda.localizacao ?? ''}
            onSave={(v) => onUpdateField('localizacao', v)}
            displayClassName="text-sm text-slate-500"
            placeholder="Localizacao (opcional)"
          />
          <InlineEditField
            value={String(fazenda.hectares_totais)}
            onSave={(v) => onUpdateField('hectares_totais', v)}
            inputType="number"
            displayClassName="text-sm font-medium text-agro-green"
            placeholder="0"
          />
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// TalhoesTable
// ---------------------------------------------------------------------------

function TalhoesTable({
  talhoes,
  costByTalhao,
}: {
  readonly talhoes: Talhao[];
  readonly costByTalhao: Map<string, number>;
}) {
  if (talhoes.length === 0) {
    return (
      <Card className="text-center py-8">
        <Layers size={32} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500 font-medium">
          Nenhum talhao cadastrado nesta fazenda.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Layers size={20} className="text-agro-green" />
          Talhoes
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Cultura
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Area (ha)
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                Custo Acumulado
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Safra
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {talhoes.map((t) => {
              const cost = costByTalhao.get(t.id) ?? 0;
              return (
                <tr
                  key={t.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">
                    {t.nome}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 bg-agro-green/10 text-agro-green rounded-md text-xs font-bold uppercase">
                      {t.cultura}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {t.area_ha.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-red-600 text-right">
                    R${' '}
                    {cost.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {t.safra}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// RecentLancamentosSection
// ---------------------------------------------------------------------------

function RecentLancamentosSection({
  lancamentos,
  talhoes,
}: {
  readonly lancamentos: Lancamento[];
  readonly talhoes: Talhao[];
}) {
  if (lancamentos.length === 0) {
    return (
      <Card className="text-center py-8">
        <Wallet size={32} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500 font-medium">
          Nenhum lancamento registrado nesta fazenda.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Wallet size={20} className="text-agro-green" />
        Ultimos Lancamentos
      </h3>
      <div className="space-y-4">
        {lancamentos.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
              {categoriaToLabel(item.categoria as CategoriaLancamento)[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {item.descricao}
              </p>
              <p className="text-xs text-slate-500">
                {categoriaToLabel(item.categoria as CategoriaLancamento)} *{' '}
                {item.data_gasto}
                {item.talhao_id && (
                  <>
                    {' '}
                    *{' '}
                    {talhoes.find((t) => t.id === item.talhao_id)?.nome ??
                      'Talhao'}
                  </>
                )}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-red-600">
                - R$ {item.valor_total.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// DangerZone
// ---------------------------------------------------------------------------

function DangerZone({
  talhoesCount,
  lancamentosCount,
  onDelete,
}: {
  readonly talhoesCount: number;
  readonly lancamentosCount: number;
  readonly onDelete: () => void;
}) {
  return (
    <Card className="bg-red-50 border-red-100">
      <div className="flex items-center gap-2 text-red-700 mb-3">
        <AlertTriangle size={20} />
        <h3 className="text-lg font-bold">Zona de Perigo</h3>
      </div>
      <p className="text-sm text-red-600 mb-4">
        Deletar esta fazenda apagara permanentemente seus{' '}
        <strong>{talhoesCount} talhoes</strong> e{' '}
        <strong>{lancamentosCount} lancamentos</strong>.
      </p>
      <button
        onClick={onDelete}
        className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 flex items-center gap-2"
      >
        <Trash2 size={16} />
        DELETAR FAZENDA
      </button>
    </Card>
  );
}
