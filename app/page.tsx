'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  PlusCircle,
  TrendingUp,
  Wallet,
  Target,
  X,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  MapPin,
  BarChart3,
  MessageSquare,
  Mic,
  Image as ImageIcon,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Search,
  History
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { labelToCategoria, categoriaToLabel } from '@/lib/categoria';
import { Lancamento, Talhao, Quote, AIResponse, SubscriptionPlan, Fazenda, CategoriaLancamento } from '@/types';
import { Sidebar, BottomNav, MoreSheet } from '@/components/navigation';

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { 
    id: 'basico', 
    name: 'Básico', 
    price: 30, 
    period: 'monthly', 
    features: ['App Mobile', 'Gestão Financeira', 'Cotações'],
    whatsapp_included: false,
    multi_farm: false
  },
  { 
    id: 'normal', 
    name: 'Normal', 
    price: 50, 
    period: 'monthly', 
    features: ['App Mobile', 'WhatsApp AI', '1 Fazenda', 'Suporte'],
    whatsapp_included: true,
    multi_farm: false
  },
  { 
    id: 'platina', 
    name: 'Platina', 
    price: 120, 
    period: 'monthly', 
    features: ['Várias Fazendas', 'WhatsApp AI', 'Relatórios Customizados', 'Consultoria'],
    whatsapp_included: true,
    multi_farm: true
  },
];

// --- Components ---

const Card = ({ children, className, ...props }: { children: React.ReactNode, className?: string, [key: string]: any }) => (
  <div className={cn("bg-white rounded-2xl p-5 shadow-sm border border-slate-100", className)} {...props}>
    {children}
  </div>
);

const StatCard = ({ title, value, subValue, icon: Icon, colorClass, trend, onClick }: any) => (
  <Card 
    className="flex flex-col gap-1 cursor-pointer hover:ring-2 hover:ring-agro-green/50 transition-all"
    onClick={onClick}
  >
    <div className="flex justify-between items-start">
      <div className={cn("p-2 rounded-xl", colorClass)}>
        <Icon size={20} className="text-white" />
      </div>
      {trend && (
        <span className={cn("text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1", 
          trend > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>
          {trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-slate-500 text-sm mt-3">{title}</p>
    <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
    {subValue && <p className="text-xs text-slate-400">{subValue}</p>}
  </Card>
);

// --- Main App Component ---

export default function App() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateFazendaModal, setShowCreateFazendaModal] = useState(false);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'launch' | 'fields' | 'quotes' | 'history' | 'reports'>('dashboard');
  const [reportType, setReportType] = useState<'profit' | 'expenses' | 'revenue' | 'break-even' | null>(null);
  const [selectedReportTalhao, setSelectedReportTalhao] = useState<string | null>(null);
  const [editingTalhao, setEditingTalhao] = useState<Talhao | null>(null);
  const [areaUnit, setAreaUnit] = useState<'ha' | 'alqueire'>('ha');
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  const formatArea = (ha: number) => {
    const val = areaUnit === 'ha' ? ha : ha / 2.42;
    return `${val.toFixed(2)} ${areaUnit === 'ha' ? 'ha' : 'alq'}`;
  };
  const [isTrial, setIsTrial] = useState(true);
  const [daysLeft, setDaysLeft] = useState(7);
  const [showSubscription, setShowSubscription] = useState(false);
  const [subscriptionLevel, setSubscriptionLevel] = useState<'basico' | 'normal' | 'platina'>('normal');

  // Multi-farm State
  const [activeFazendaId, setActiveFazendaId] = useState<string>('');
  const [fazendas, setFazendas] = useState<Fazenda[]>([]);

  // Quotes State
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  // AI State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [showAiConfirmation, setShowAiConfirmation] = useState(false);
  const [showCreateFieldModal, setShowCreateFieldModal] = useState(false);
  const [showWhatsAppChat, setShowWhatsAppChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{text: string, isUser: boolean}[]>([
    { text: "Olá! Sou o AgroCusto AI. Como posso ajudar com seus custos hoje?", isUser: false }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Form State for Launch
  const [launchValue, setLaunchValue] = useState('');
  const [launchScope, setLaunchScope] = useState('Fazenda Toda');
  const [launchDesc, setLaunchDesc] = useState('');
  const [launchTalhaoId, setLaunchTalhaoId] = useState<string | null>(null);
  const [launchCultura, setLaunchCultura] = useState('');
  const [launchSafra, setLaunchSafra] = useState('24/25');
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  // Transactions State
  const [transactions, setTransactions] = useState<Lancamento[]>([]);
  const [talhoes, setTalhoes] = useState<Talhao[]>([]);

  // Fetch initial data from Supabase
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const fazRes = await supabase.from('fazendas').select('*').order('nome');
      const talRes = await supabase.from('talhoes').select('*').order('nome');
      const lanRes = await supabase.from('lancamentos').select('*').order('data_gasto', { ascending: false });

      const fazendaRows = fazRes.data ?? [];
      const talhaoRows = talRes.data ?? [];
      const lancamentoRows = lanRes.data ?? [];

      setFazendas(fazendaRows);
      if (fazendaRows.length > 0) setActiveFazendaId(fazendaRows[0].id);
      setTalhoes(talhaoRows);
      setTransactions(lancamentoRows);
      setIsLoading(false);
    }
    load();
  }, [supabase]);

  useEffect(() => {
    if (activeTab === 'quotes') {
      fetchQuotes();
    }
  }, [activeTab]);

  const fetchQuotes = async () => {
    setLoadingQuotes(true);
    try {
      const res = await fetch('/api/quotes');
      const data = await res.json();
      setQuotes(data);
    } catch (err) {
      console.error("Error fetching quotes:", err);
    } finally {
      setLoadingQuotes(false);
    }
  };

  const handleAiParse = async (input: string, imageBase64?: string) => {
    setIsAiLoading(true);
    try {
      const response = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, imageBase64 }),
      });

      const result = await response.json();

      // Check if fields exist
      if (result.talhao_nomes && result.talhao_nomes.length > 0) {
        result.talhao_ids = [];
        result.fieldExists = true;
        
        result.talhao_nomes.forEach((nome: string) => {
          const existingField = talhoes.find(t => t.nome.toLowerCase() === nome.toLowerCase());
          if (!existingField) {
            result.fieldExists = false;
          } else {
            result.talhao_ids.push(existingField.id);
          }
        });
      }

      setAiResult(result);
      
      // Auto-fill form if data is clear
      if (result.valor) setLaunchValue(result.valor.toString());
      if (result.descricao) setLaunchDesc(result.descricao);
      if (result.talhao_ids && result.talhao_ids.length === 1) {
        setLaunchTalhaoId(result.talhao_ids[0]);
        setLaunchScope(`Talhão ${result.talhao_ids[0]}`);
      } else if (result.talhao_ids && result.talhao_ids.length > 1) {
        setLaunchScope(`Múltiplos Talhões (${result.talhao_ids.length})`);
      }
      if (result.cultura) setLaunchCultura(result.cultura);
      if (result.safra) setLaunchSafra(result.safra);
      
      setShowAiConfirmation(true);
    } catch (err) {
      console.error("AI Error:", err);
      alert("Erro ao processar com IA. Tente novamente.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleLaunch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userId) return;

    // If field doesn't exist, we should block or ask to create
    if (aiResult?.talhao_nomes?.length > 0 && !aiResult.fieldExists) {
      setShowCreateFieldModal(true);
      return;
    }

    const value = parseFloat(launchValue);
    if (isNaN(value) || value <= 0) {
      alert('Informe um valor maior que zero antes de salvar.');
      return;
    }
    const categoria = labelToCategoria(aiResult?.categoria || 'Outros');
    const dataGasto = new Date().toISOString().split('T')[0];

    // Handle multiple talhoes division
    if (aiResult?.talhao_ids?.length > 1) {
      const dividedValue = value / aiResult.talhao_ids.length;
      const rows = aiResult.talhao_ids.map((tid: string, index: number) => ({
        usuario_id: userId,
        talhao_id: tid,
        valor_total: dividedValue,
        categoria,
        data_gasto: dataGasto,
        descricao: `${launchDesc} (Rateio ${index + 1}/${aiResult.talhao_ids.length})`,
        cultura: launchCultura || 'Geral',
        safra: launchSafra,
      }));

      const { data, error } = await supabase.from('lancamentos').insert(rows).select();
      if (error) { alert('Erro ao salvar lancamentos: ' + error.message); return; }
      if (data) setTransactions([...data, ...transactions]);
    } else {
      const row = {
        usuario_id: userId,
        talhao_id: launchTalhaoId,
        valor_total: value,
        categoria,
        data_gasto: dataGasto,
        descricao: launchDesc,
        cultura: launchCultura || 'Geral',
        safra: launchSafra,
      };

      const { data, error } = await supabase.from('lancamentos').insert(row).select().single();
      if (error) { alert('Erro ao salvar lancamento: ' + error.message); return; }
      if (data) setTransactions([data, ...transactions]);
    }

    alert('Lancamento salvo com sucesso!');

    setLaunchValue('');
    setLaunchDesc('');
    setLaunchTalhaoId(null);
    setLaunchCultura('');
    setLaunchScope('Fazenda Toda');
    setAiResult(null);
    setShowAiConfirmation(false);
    setActiveTab('dashboard');
  };

  const handleCreateField = async (nome: string, area: number, cultura: string) => {
    // Convert to hectares if input was in alqueires
    const areaHa = areaUnit === 'ha' ? area : area * 2.42;

    const fazenda = fazendas.find(f => f.id === activeFazendaId);
    if (fazenda) {
      const currentSum = talhoes
        .filter(t => t.fazenda_id === activeFazendaId)
        .reduce((acc, t) => acc + t.area_ha, 0);
      const newSum = currentSum + areaHa;
      if (newSum > fazenda.hectares_totais) {
        const excess = newSum - fazenda.hectares_totais;
        const ok = window.confirm(
          `A soma dos talhoes (${newSum.toFixed(2)} ha) vai exceder a area total da fazenda (${fazenda.hectares_totais.toFixed(2)} ha) em ${excess.toFixed(2)} ha. Continuar?`
        );
        if (!ok) return;
      }
    }

    const { data, error } = await supabase
      .from('talhoes')
      .insert({
        fazenda_id: activeFazendaId,
        nome,
        area_ha: areaHa,
        cultura,
        safra: '24/25',
      })
      .select()
      .single();

    if (error) { alert('Erro ao criar talhao: ' + error.message); return; }
    if (!data) return;

    setTalhoes([...talhoes, data]);
    setLaunchTalhaoId(data.id);
    setLaunchScope(`Talhao ${data.id}`);
    setLaunchCultura(cultura);
    setShowCreateFieldModal(false);

    // Resume launch with the new field
    setTimeout(() => {
      handleLaunch();
    }, 100);
  };

  const handleRepeatSafra = async () => {
    const nextSafra = '25/26';
    const currentTalhoes = talhoes.filter(t => t.fazenda_id === activeFazendaId);
    if (currentTalhoes.length === 0) {
      alert('Nenhum talhao encontrado para repetir.');
      return;
    }

    const newRows = currentTalhoes.map(t => ({
      fazenda_id: t.fazenda_id,
      nome: t.nome,
      area_ha: t.area_ha,
      cultura: t.cultura,
      safra: nextSafra,
    }));

    const { data, error } = await supabase.from('talhoes').insert(newRows).select();
    if (error) { alert('Erro ao repetir safra: ' + error.message); return; }
    if (data) setTalhoes([...talhoes, ...data]);
    alert(`Estrutura fisica repetida para a safra ${nextSafra}!`);
  };

  const handleUpdateTalhao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTalhao) return;

    const fazenda = fazendas.find(f => f.id === editingTalhao.fazenda_id);
    if (fazenda) {
      const original = talhoes.find(t => t.id === editingTalhao.id);
      const currentSum = talhoes
        .filter(t => t.fazenda_id === editingTalhao.fazenda_id)
        .reduce((acc, t) => acc + t.area_ha, 0);
      const newSum = currentSum - (original?.area_ha ?? 0) + editingTalhao.area_ha;
      if (newSum > fazenda.hectares_totais) {
        const excess = newSum - fazenda.hectares_totais;
        const ok = window.confirm(
          `A soma dos talhoes (${newSum.toFixed(2)} ha) vai exceder a area total da fazenda (${fazenda.hectares_totais.toFixed(2)} ha) em ${excess.toFixed(2)} ha. Continuar?`
        );
        if (!ok) return;
      }
    }

    const { data, error } = await supabase
      .from('talhoes')
      .update({
        nome: editingTalhao.nome,
        area_ha: editingTalhao.area_ha,
        cultura: editingTalhao.cultura,
        safra: editingTalhao.safra,
      })
      .eq('id', editingTalhao.id)
      .select()
      .single();

    if (error) { alert('Erro ao atualizar talhao: ' + error.message); return; }
    if (data) setTalhoes(talhoes.map(t => t.id === data.id ? data : t));
    setEditingTalhao(null);
    alert('Talhao atualizado com sucesso!');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleAiParse("Analise esta nota fiscal.", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateFazenda = async (nome: string, hectares: number, localizacao: string | null) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('fazendas')
      .insert({ usuario_id: userId, nome, hectares_totais: hectares, localizacao })
      .select()
      .single();
    if (error) { alert('Erro ao criar fazenda: ' + error.message); return; }
    if (!data) return;
    setFazendas([...fazendas, data]);
    setActiveFazendaId(data.id);
    setShowCreateFazendaModal(false);
  };

  // Compute chart data from real transactions
  const chartData = useMemo(() => {
    const fieldTalhoes = talhoes.filter(t => t.fazenda_id === activeFazendaId);
    const items = fieldTalhoes.map(t => ({
      name: t.nome,
      custo: transactions
        .filter(l => l.talhao_id === t.id)
        .reduce((acc, curr) => acc + curr.valor_total, 0),
    }));
    const sedeCusto = transactions
      .filter(l => l.talhao_id === null)
      .reduce((acc, curr) => acc + curr.valor_total, 0);
    if (sedeCusto > 0) items.push({ name: 'Sede', custo: sedeCusto });
    return items;
  }, [talhoes, transactions, activeFazendaId]);

  return (
    <div className="h-screen bg-agro-bg flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden bg-agro-green text-white p-4 flex items-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-white p-1.5 rounded-lg">
            <TrendingUp size={20} className="text-agro-green" />
          </div>
          <h1 className="font-display font-bold text-xl tracking-tight">AgroCusto</h1>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
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
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onMoreClick={() => setIsMoreSheetOpen(true)}
      />

      {/* Mobile More Sheet */}
      <MoreSheet
        isOpen={isMoreSheetOpen}
        onClose={() => setIsMoreSheetOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        fazendas={fazendas}
        activeFazendaId={activeFazendaId}
        onFazendaChange={setActiveFazendaId}
        isTrial={isTrial}
        daysLeft={daysLeft}
        onShowSubscription={() => setShowSubscription(true)}
        userName="João Produtor"
      />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 overflow-y-auto">
        {isLoading && (
          <div className="max-w-md mx-auto mt-20 text-center text-slate-400">
            Carregando...
          </div>
        )}

        {!isLoading && fazendas.length === 0 && (
          <div className="max-w-md mx-auto mt-20 text-center space-y-4">
            <div className="w-16 h-16 bg-agro-green/10 text-agro-green rounded-full flex items-center justify-center mx-auto">
              <MapPin size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Crie sua primeira fazenda</h2>
            <p className="text-slate-500">Voce precisa cadastrar uma fazenda antes de comecar a registrar custos.</p>
            <button
              onClick={() => setShowCreateFazendaModal(true)}
              className="bg-agro-green text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-agro-green/20 hover:bg-agro-green/90 transition-all"
            >
              CRIAR FAZENDA
            </button>
          </div>
        )}

        {fazendas.length > 0 && <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-6xl mx-auto space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Resumo Financeiro</h2>
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin size={16} />
                    <select 
                      value={activeFazendaId}
                      onChange={(e) => setActiveFazendaId(e.target.value)}
                      className="bg-transparent border-none outline-none font-medium text-agro-green cursor-pointer"
                    >
                      {fazendas.map(f => (
                        <option key={f.id} value={f.id}>{f.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                  <button 
                    onClick={() => setActiveTab('history')}
                    className="px-4 py-2 rounded-lg text-slate-500 text-sm font-medium hover:bg-slate-50"
                  >
                    Histórico de Safra
                  </button>
                  <div className="h-4 w-px bg-slate-200 mx-1" />
                  <select 
                    value={areaUnit}
                    onChange={(e) => setAreaUnit(e.target.value as any)}
                    className="px-3 py-2 rounded-lg text-slate-600 text-sm font-medium bg-transparent outline-none cursor-pointer"
                  >
                    <option value="ha">Hectares (ha)</option>
                    <option value="alqueire">Alqueires (alq)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                  title="Lucro Projetado" 
                  value="R$ 145.200" 
                  subValue={`Baseado em 60 sc/${areaUnit === 'ha' ? 'ha' : 'alq'}`}
                  icon={TrendingUp} 
                  colorClass="bg-agro-green"
                  trend={12}
                  onClick={() => { setReportType('profit'); setActiveTab('reports'); }}
                />
                <StatCard 
                  title="Gastos Atuais" 
                  value="R$ 82.450" 
                  subValue="45% do orçamento"
                  icon={Wallet} 
                  colorClass="bg-agro-earth"
                  onClick={() => { setReportType('expenses'); setActiveTab('reports'); }}
                />
                <StatCard 
                  title="Receita Estimada" 
                  value="R$ 227.650" 
                  subValue={`Preço: R$ 135/sc`}
                  icon={DollarSign} 
                  colorClass="bg-agro-gold"
                  onClick={() => { setReportType('revenue'); setActiveTab('reports'); }}
                />
                <StatCard 
                  title="Ponto de Equilíbrio" 
                  value={`${areaUnit === 'ha' ? '42' : (42 * 2.42).toFixed(0)} sc/${areaUnit === 'ha' ? 'ha' : 'alq'}`}
                  subValue={`Meta: ${areaUnit === 'ha' ? '60' : (60 * 2.42).toFixed(0)} sc/${areaUnit === 'ha' ? 'ha' : 'alq'}`}
                  icon={Target} 
                  colorClass="bg-blue-600"
                  onClick={() => { setReportType('break-even'); setActiveTab('reports'); }}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <BarChart3 size={20} className="text-agro-green" />
                    Custos por Área
                  </h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <Tooltip 
                          cursor={{fill: '#f8fafc'}}
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        />
                        <Bar dataKey="custo" radius={[6, 6, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.name === 'Sede' ? '#5D4037' : '#2E7D32'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card>
                  <h3 className="text-lg font-bold mb-4">Últimos Lançamentos</h3>
                  <div className="space-y-4">
                    {transactions.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                          {categoriaToLabel(item.categoria as CategoriaLancamento)[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{item.descricao}</p>
                          <p className="text-xs text-slate-500">{categoriaToLabel(item.categoria as CategoriaLancamento)} • {item.data_gasto}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-red-600">- R$ {item.valor_total.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => setActiveTab('history')}
                      className="w-full py-3 text-sm font-bold text-agro-green hover:bg-agro-green/5 rounded-xl transition-colors"
                    >
                      Ver todos
                    </button>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === 'launch' && (
            <motion.div 
              key="launch"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-agro-green/10 text-agro-green rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Lançamento Inteligente</h2>
                  <p className="text-slate-500">Use voz, texto ou foto para registrar gastos.</p>
                </div>

                {/* AI Input Area */}
                <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex gap-2 mb-4">
                    <input 
                      type="text" 
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder="Ex: 'Gastei 500 em diesel no talhão 02'"
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-agro-green"
                    />
                    <button 
                      onClick={() => handleAiParse(aiInput)}
                      disabled={isAiLoading || !aiInput}
                      className="bg-agro-green text-white p-3 rounded-xl disabled:opacity-50"
                    >
                      {isAiLoading ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                  </div>
                  <div className="flex justify-center gap-4">
                    <button className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-agro-green transition-colors">
                      <Mic size={18} />
                      Áudio
                    </button>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-agro-green cursor-pointer transition-colors">
                      <ImageIcon size={18} />
                      Foto Recibo
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>

                <AnimatePresence>
                  {showAiConfirmation && aiResult && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-8 p-6 bg-agro-green/5 border-2 border-agro-green/20 rounded-2xl"
                    >
                      <div className="flex items-center gap-2 text-agro-green mb-4">
                        <CheckCircle2 size={20} />
                        <span className="font-bold">IA Identificou:</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-bold">Valor</p>
                          <p className="text-lg font-bold text-slate-900">R$ {aiResult.valor?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-bold">Categoria</p>
                          <p className="text-lg font-bold text-slate-900">{aiResult.categoria}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-slate-400 uppercase font-bold">Local / Cultura / Safra</p>
                          <p className="text-lg font-bold text-slate-900">
                            {aiResult.talhao_ids?.length > 1 
                              ? `Múltiplos Talhões (${aiResult.talhao_ids.length})` 
                              : (aiResult.talhao_id ? `Talhão ${aiResult.talhao_id}` : 'Fazenda Toda')} 
                            • {aiResult.cultura || 'Geral'} • {aiResult.safra || '24/25'}
                          </p>
                          {aiResult.talhao_ids?.length > 1 && (
                            <p className="text-xs text-agro-green font-bold mt-1">O valor será dividido igualmente entre os talhões.</p>
                          )}
                        </div>
                      </div>
                      {aiResult.missingContext && (
                        <div className="mb-4 p-3 bg-amber-50 text-amber-700 rounded-xl text-sm flex items-start gap-2">
                          <AlertCircle size={16} className="mt-0.5 shrink-0" />
                          <p>{aiResult.missingContext}</p>
                        </div>
                      )}
                      <div className="flex gap-3">
                        {aiResult.talhao_nome && !aiResult.fieldExists ? (
                          <button 
                            onClick={() => setShowCreateFieldModal(true)}
                            className="flex-1 py-3 bg-agro-earth text-white rounded-xl font-bold text-sm shadow-lg shadow-agro-earth/20"
                          >
                            CRIAR TALHÃO: {aiResult.talhao_nome}
                          </button>
                        ) : (
                          <>
                            <button 
                              onClick={() => setShowAiConfirmation(false)}
                              className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm"
                            >
                              CORRIGIR
                            </button>
                            <button 
                              onClick={() => handleLaunch()}
                              className="flex-1 py-3 bg-agro-green text-white rounded-xl font-bold text-sm shadow-lg shadow-agro-green/20"
                            >
                              CONFIRMAR
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!showAiConfirmation && (
                  <form onSubmit={handleLaunch} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Valor do Gasto (R$)</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</div>
                        <input 
                          type="number" 
                          required
                          value={launchValue}
                          onChange={(e) => setLaunchValue(e.target.value)}
                          placeholder="0,00"
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-agro-green focus:border-transparent outline-none transition-all text-xl font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Destino do Gasto</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => { setLaunchScope('Fazenda Toda'); setLaunchTalhaoId(null); }}
                          className={cn(
                            "py-4 rounded-2xl border-2 font-bold text-sm transition-all",
                            launchScope === 'Fazenda Toda' 
                              ? "bg-agro-green border-agro-green text-white shadow-lg shadow-agro-green/20" 
                              : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                          )}
                        >
                          Fazenda Toda
                        </button>
                        <select 
                          value={launchTalhaoId || ''}
                          onChange={(e) => {
                            const id = e.target.value;
                            setLaunchTalhaoId(id);
                            setLaunchScope(`Talhão ${id}`);
                          }}
                          className={cn(
                            "py-4 px-4 rounded-2xl border-2 font-bold text-sm transition-all outline-none",
                            launchTalhaoId 
                              ? "bg-agro-green border-agro-green text-white shadow-lg shadow-agro-green/20" 
                              : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                          )}
                        >
                          <option value="" disabled className="text-slate-900">Selecionar Talhão</option>
                          {talhoes.filter(t => t.fazenda_id === activeFazendaId).map(t => (
                            <option key={t.id} value={t.id} className="text-slate-900">{t.nome} ({t.cultura})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Cultura</label>
                        <select 
                          value={launchCultura}
                          onChange={(e) => setLaunchCultura(e.target.value)}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-agro-green"
                        >
                          <option value="">Selecione a Cultura</option>
                          <option value="Soja">Soja</option>
                          <option value="Milho">Milho</option>
                          <option value="Trigo">Trigo</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Safra</label>
                        <select 
                          value={launchSafra}
                          onChange={(e) => setLaunchSafra(e.target.value)}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-agro-green"
                        >
                          <option value="23/24">23/24</option>
                          <option value="24/25">24/25</option>
                          <option value="25/26">25/26</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Descrição / Categoria</label>
                      <input 
                        type="text" 
                        required
                        value={launchDesc}
                        onChange={(e) => setLaunchDesc(e.target.value)}
                        placeholder="Ex: Diesel S10, Semente Soja..."
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-agro-green"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-5 bg-agro-green text-white rounded-2xl font-bold text-lg shadow-xl shadow-agro-green/30 hover:bg-agro-green/90 active:scale-[0.98] transition-all"
                    >
                      SALVAR LANÇAMENTO
                    </button>
                  </form>
                )}
              </Card>
            </motion.div>
          )}

          {activeTab === 'fields' && (
            <motion.div 
              key="fields"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-6xl mx-auto space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Talhões e Áreas</h2>
                  <p className="text-slate-500">Gerencie os custos acumulados por cada área de plantio.</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleRepeatSafra}
                    className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all"
                  >
                    <RefreshCw size={20} />
                    Repetir Safra
                  </button>
                  <button 
                    onClick={() => {
                      setAiResult({ talhao_nome: "", cultura: "", fieldExists: false });
                      setShowCreateFieldModal(true);
                    }}
                    className="bg-agro-earth text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-agro-earth/90 transition-all"
                  >
                    <PlusCircle size={20} />
                    Novo Talhão
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {talhoes.filter(t => t.fazenda_id === activeFazendaId).map((talhao) => {
                  const custo = transactions
                    .filter(l => l.talhao_id === talhao.id)
                    .reduce((acc, curr) => acc + curr.valor_total, 0);
                  
                  const areaExibida = areaUnit === 'ha' ? talhao.area_ha : talhao.area_ha / 2.42;
                  const custoPorUnidade = areaExibida > 0 ? (custo / areaExibida).toFixed(2) : 0;
                  
                  return (
                    <Card 
                      key={talhao.id} 
                      className="group hover:border-agro-green transition-all cursor-pointer"
                      onClick={() => setEditingTalhao(talhao)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-agro-green/10 p-3 rounded-2xl text-agro-green">
                          <MapPin size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{formatArea(talhao.area_ha)}</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-1">{talhao.nome}</h3>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-bold bg-agro-green/10 text-agro-green px-2 py-1 rounded-md uppercase">
                          {talhao.cultura}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mb-6">Custo acumulado nesta safra</p>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-xs text-slate-400 font-bold uppercase">Total</p>
                            <p className="text-2xl font-bold text-agro-green">R$ {custo.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400 font-bold uppercase">Por {areaUnit === 'ha' ? 'Ha' : 'Alq'}</p>
                            <p className="text-sm font-bold text-slate-700">R$ {custoPorUnidade}</p>
                          </div>
                        </div>
                        
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '45%' }}
                            className="bg-agro-green h-full rounded-full"
                          />
                        </div>
                        
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-xs font-medium text-slate-500">45% do limite projetado</span>
                          <ChevronRight size={16} className="text-slate-300 group-hover:text-agro-green transition-colors" />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'quotes' && (
            <motion.div 
              key="quotes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Cotações do Dia</h2>
                  <p className="text-slate-500">Preços atualizados dos principais grãos e insumos.</p>
                </div>
                <button 
                  onClick={fetchQuotes}
                  className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-agro-green transition-colors"
                >
                  <RefreshCw size={20} className={loadingQuotes ? "animate-spin" : ""} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quotes.map((quote) => (
                  <Card key={quote.id} className="relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                        <TrendingUp size={18} />
                      </div>
                      <span className={cn(
                        "text-xs font-bold px-2 py-1 rounded-full",
                        quote.change >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                      )}>
                        {quote.change >= 0 ? '+' : ''}{quote.change}%
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{quote.commodity}</h4>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-900">R$ {quote.price.toFixed(2)}</span>
                      <span className="text-xs text-slate-400">/{quote.unit}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-4 flex items-center gap-1">
                      <History size={10} />
                      Fonte: {quote.source} • {new Date(quote.lastUpdate).toLocaleTimeString()}
                    </p>
                    {quote.change > 0 && (
                      <div className="absolute -right-4 -bottom-4 opacity-5 text-green-600">
                        <ArrowUpRight size={80} />
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              <Card className="p-0 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold">Tendência de Mercado (Soja)</h3>
                  <span className="text-xs text-agro-green font-bold bg-agro-green/10 px-3 py-1 rounded-full">Alta de 2.4% na semana</span>
                </div>
                <div className="h-[300px] w-full p-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { day: 'Seg', price: 132 },
                      { day: 'Ter', price: 133.5 },
                      { day: 'Qua', price: 133 },
                      { day: 'Qui', price: 134.8 },
                      { day: 'Sex', price: 135.5 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#2E7D32" 
                        strokeWidth={3} 
                        dot={{fill: '#2E7D32', strokeWidth: 2, r: 4}} 
                        activeDot={{r: 6, strokeWidth: 0}}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-6xl mx-auto space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Histórico de Lançamentos</h2>
                  <p className="text-slate-500">Visualize e gerencie todos os registros financeiros.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 md:w-64">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar lançamentos..."
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-agro-green"
                    />
                  </div>
                </div>
              </div>

              <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Data</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Categoria</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Local</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-slate-600">{item.data_gasto}</td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.descricao}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                              {categoriaToLabel(item.categoria as CategoriaLancamento)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {item.talhao_id ? talhoes.find(t => t.id === item.talhao_id)?.nome ?? item.talhao_id : 'Fazenda Toda'}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-red-600 text-right">
                            - R$ {item.valor_total.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="bg-agro-green/5 border-agro-green/20">
                <h3 className="font-bold text-agro-green mb-2 flex items-center gap-2">
                  <AlertCircle size={18} />
                  Entenda os Cálculos
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  O <strong>Ponto de Equilíbrio</strong> é calculado dividindo o custo total acumulado pelo preço de mercado atual da cultura. 
                  Para talhões específicos, consideramos apenas os custos diretos e a área (ha) correspondente. 
                  Lançamentos na "Fazenda Toda" são rateados proporcionalmente entre todos os talhões ativos para garantir precisão na margem de lucro.
                </p>
              </Card>
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div 
              key="reports"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-6xl mx-auto space-y-6"
            >
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    if (selectedReportTalhao) setSelectedReportTalhao(null);
                    else setActiveTab('dashboard');
                  }}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={24} className="text-slate-400" />
                </button>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">
                    {reportType === 'profit' && "Relatório de Lucro Projetado"}
                    {reportType === 'expenses' && "Relatório de Gastos Atuais"}
                    {reportType === 'revenue' && "Relatório de Receita Estimada"}
                    {reportType === 'break-even' && "Relatório de Ponto de Equilíbrio"}
                  </h2>
                  <p className="text-slate-500">
                    {selectedReportTalhao 
                      ? `Detalhamento: ${talhoes.find(t => t.id === selectedReportTalhao)?.nome}` 
                      : "Visão consolidada por talhão"}
                  </p>
                </div>
              </div>

              {!selectedReportTalhao ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {talhoes
                    .filter(t => t.fazenda_id === activeFazendaId)
                    .sort((a, b) => {
                      const custoA = transactions.filter(l => l.talhao_id === a.id).reduce((acc, curr) => acc + curr.valor_total, 0);
                      const custoB = transactions.filter(l => l.talhao_id === b.id).reduce((acc, curr) => acc + curr.valor_total, 0);
                      
                      if (reportType === 'expenses') return custoB - custoA;
                      if (reportType === 'revenue') return (b.area_ha * 2500) - (a.area_ha * 2500);
                      if (reportType === 'profit') return ((b.area_ha * 2500) - custoB) - ((a.area_ha * 2500) - custoA);
                      return 0;
                    })
                    .map(talhao => {
                      const custo = transactions
                        .filter(l => l.talhao_id === talhao.id)
                        .reduce((acc, curr) => acc + curr.valor_total, 0);
                      
                      const receita = talhao.area_ha * 2500; // Mock formula
                      const lucro = receita - custo;
                      const pe = (custo / 135) / (areaUnit === 'ha' ? talhao.area_ha : talhao.area_ha / 2.42);
                    
                    return (
                      <Card 
                        key={talhao.id} 
                        className={cn(
                          "cursor-pointer hover:border-agro-green transition-all border-2",
                          reportType === 'profit' && lucro > 50000 ? "border-green-100" : "border-slate-100",
                          reportType === 'profit' && lucro < 10000 ? "border-red-100" : ""
                        )}
                        onClick={() => setSelectedReportTalhao(talhao.id)}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-bold text-lg">{talhao.nome}</h4>
                          <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">{talhao.cultura}</span>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Área:</span>
                            <span className="font-bold">{formatArea(talhao.area_ha)}</span>
                          </div>

                          {(reportType === 'expenses' || reportType === 'profit') && (
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Custo Total:</span>
                              <span className="font-bold text-red-600">R$ {custo.toLocaleString()}</span>
                            </div>
                          )}

                          {(reportType === 'revenue' || reportType === 'profit') && (
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Receita Est.:</span>
                              <span className="font-bold text-agro-gold">R$ {receita.toLocaleString()}</span>
                            </div>
                          )}

                          {reportType === 'profit' && (
                            <div className="flex justify-between text-sm pt-2 border-t border-slate-50">
                              <span className="text-slate-500 font-bold">Lucro Est.:</span>
                              <span className={cn("font-bold", lucro > 0 ? "text-agro-green" : "text-red-600")}>
                                R$ {lucro.toLocaleString()}
                              </span>
                            </div>
                          )}

                          {reportType === 'break-even' && (
                            <div className="space-y-2 pt-2 border-t border-slate-50">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Ponto Equilíbrio:</span>
                                <span className="font-bold">{pe.toFixed(1)} sc/{areaUnit === 'ha' ? 'ha' : 'alq'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={cn("h-full rounded-full", pe > 50 ? "bg-red-500" : "bg-agro-green")} 
                                    style={{ width: `${Math.min(pe * 2, 100)}%` }} 
                                  />
                                </div>
                                <span className={cn("text-[10px] font-bold", pe > 50 ? "text-red-500" : "text-agro-green")}>
                                  {pe > 50 ? "ALTO" : "IDEAL"}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 flex items-center justify-center text-agro-green text-xs font-bold gap-1">
                          VER LANÇAMENTOS <ChevronRight size={12} />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="p-0 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold">Lançamentos do Talhão</h3>
                    <button 
                      onClick={() => setSelectedReportTalhao(null)}
                      className="text-xs font-bold text-agro-green hover:underline"
                    >
                      Voltar para lista
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Data</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Categoria</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transactions.filter(l => l.talhao_id === selectedReportTalhao).length > 0 ? (
                          transactions.filter(l => l.talhao_id === selectedReportTalhao).map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 text-sm text-slate-600">{item.data_gasto}</td>
                              <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.descricao}</td>
                              <td className="px-6 py-4 text-sm">
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                                  {categoriaToLabel(item.categoria as CategoriaLancamento)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-red-600 text-right">
                                - R$ {item.valor_total.toLocaleString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                              Nenhum lançamento encontrado para este talhão.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>}
      </main>

      {/* Create Fazenda Modal */}
      <AnimatePresence>
        {showCreateFazendaModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateFazendaModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8"
            >
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Nova Fazenda</h3>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const nome = (form.elements.namedItem('fazenda-nome') as HTMLInputElement).value;
                  const hectares = parseFloat((form.elements.namedItem('fazenda-hectares') as HTMLInputElement).value);
                  const loc = (form.elements.namedItem('fazenda-localizacao') as HTMLInputElement).value.trim();
                  handleCreateFazenda(nome, hectares, loc || null);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Nome</label>
                  <input
                    type="text"
                    name="fazenda-nome"
                    required
                    placeholder="Ex: Fazenda Boa Vista"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-agro-green"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Hectares Totais</label>
                  <input
                    type="number"
                    name="fazenda-hectares"
                    required
                    step="0.01"
                    min="0"
                    placeholder="Ex: 150"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-agro-green"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Localizacao (opcional)</label>
                  <input
                    type="text"
                    name="fazenda-localizacao"
                    placeholder="Ex: Cidade, Estado"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-agro-green"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateFazendaModal(false)}
                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-agro-green text-white rounded-xl font-bold text-sm shadow-lg shadow-agro-green/20"
                  >
                    CRIAR
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Subscription Modal */}
      <AnimatePresence>
        {showSubscription && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSubscription(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3">
                <div className="md:col-span-1 bg-agro-green p-8 text-white">
                  <h3 className="text-2xl font-bold mb-4">Escolha seu Plano</h3>
                  <p className="text-agro-green-light/80 text-sm mb-8">
                    Tenha acesso ilimitado a todas as ferramentas de IA e gestão financeira.
                  </p>
                  <ul className="space-y-4">
                    {[
                      'Lançamentos ilimitados',
                      'IA via WhatsApp 24/7',
                      'Cotações em tempo real',
                      'Relatórios de lucratividade',
                      'Suporte prioritário'
                    ].map((feat, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <CheckCircle2 size={18} className="text-agro-gold" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="md:col-span-2 p-8">
                  <div className="flex justify-between items-center mb-8">
                    <h4 className="font-bold text-slate-900">Níveis de Assinatura</h4>
                    <button onClick={() => setShowSubscription(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {SUBSCRIPTION_PLANS.map((plan) => (
                      <div 
                        key={plan.id}
                        onClick={() => {
                          setSubscriptionLevel(plan.id as any);
                          setIsTrial(false);
                          setShowSubscription(false);
                          alert(`Assinatura ${plan.name} ativada!`);
                        }}
                        className={cn(
                          "group relative p-6 border-2 rounded-2xl transition-all cursor-pointer flex justify-between items-center",
                          subscriptionLevel === plan.id ? "border-agro-green bg-agro-green/5" : "border-slate-100 hover:border-agro-green"
                        )}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-slate-900">{plan.name}</h5>
                            {plan.whatsapp_included && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">WhatsApp AI</span>}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{plan.features.join(' • ')}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-baseline gap-1 justify-end">
                            <span className="text-xs font-bold text-slate-400">R$</span>
                            <span className="text-2xl font-bold text-slate-900">{plan.price}</span>
                            <span className="text-xs text-slate-400">/mês</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-8 py-4 bg-agro-green text-white rounded-2xl font-bold shadow-lg shadow-agro-green/20 hover:bg-agro-green/90 transition-all">
                    CONFIRMAR ASSINATURA
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Talhão Modal */}
      <AnimatePresence>
        {editingTalhao && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingTalhao(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8"
            >
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Editar Talhão</h3>
              
              <form onSubmit={handleUpdateTalhao} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Nome</label>
                  <input 
                    type="text" 
                    value={editingTalhao.nome}
                    onChange={(e) => setEditingTalhao({...editingTalhao, nome: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-agro-green"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Área ({areaUnit === 'ha' ? 'ha' : 'alq'})</label>
                    <input 
                      type="number" 
                      value={areaUnit === 'ha' ? editingTalhao.area_ha : (editingTalhao.area_ha / 2.42).toFixed(2)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        const ha = areaUnit === 'ha' ? val : val * 2.42;
                        setEditingTalhao({...editingTalhao, area_ha: ha});
                      }}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-agro-green"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Cultura</label>
                    <input 
                      type="text" 
                      value={editingTalhao.cultura}
                      onChange={(e) => setEditingTalhao({...editingTalhao, cultura: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-agro-green"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Safra</label>
                  <select 
                    value={editingTalhao.safra}
                    onChange={(e) => setEditingTalhao({...editingTalhao, safra: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-agro-green"
                  >
                    <option value="23/24">23/24</option>
                    <option value="24/25">24/25</option>
                    <option value="25/26">25/26</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setEditingTalhao(null)}
                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm"
                  >
                    CANCELAR
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-agro-green text-white rounded-xl font-bold text-sm shadow-lg shadow-agro-green/20"
                  >
                    SALVAR
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Field Modal */}
      <AnimatePresence>
        {showCreateFieldModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateFieldModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8"
            >
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Novo Talhão Detectado</h3>
              <p className="text-slate-500 mb-6">A IA identificou o "{aiResult?.talhao_nome}", mas ele ainda não existe. Deseja cadastrá-lo agora?</p>
              
              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Nome do Talhão</label>
                  <input 
                    type="text" 
                    defaultValue={aiResult?.talhao_nome}
                    id="new-field-name"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-agro-green"
                  />
                </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Área ({areaUnit === 'ha' ? 'ha' : 'alq'})</label>
                        <input 
                          type="number" 
                          placeholder={areaUnit === 'ha' ? "Ex: 50" : "Ex: 20"}
                          id="new-field-area"
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-agro-green"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Cultura</label>
                        <input 
                          type="text" 
                          defaultValue={aiResult?.cultura || ""}
                          placeholder="Ex: Soja"
                          id="new-field-cultura"
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-agro-green"
                        />
                      </div>
                    </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowCreateFieldModal(false)}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm"
                >
                  CANCELAR
                </button>
                <button 
                  onClick={() => {
                    const name = (document.getElementById('new-field-name') as HTMLInputElement).value;
                    const area = parseFloat((document.getElementById('new-field-area') as HTMLInputElement).value);
                    const cultura = (document.getElementById('new-field-cultura') as HTMLInputElement).value;
                    handleCreateField(name, area, cultura);
                  }}
                  className="flex-1 py-3 bg-agro-green text-white rounded-xl font-bold text-sm shadow-lg shadow-agro-green/20"
                >
                  CRIAR E SALVAR
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WhatsApp Simulation Chat */}
      <AnimatePresence>
        {showWhatsAppChat && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 h-[500px] bg-white rounded-3xl shadow-2xl z-[120] flex flex-col overflow-hidden border border-slate-100"
          >
            <div className="bg-[#075E54] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="font-bold text-sm">AgroCusto AI</p>
                  <p className="text-[10px] opacity-80">Online • Assistente Virtual</p>
                </div>
              </div>
              <button onClick={() => setShowWhatsAppChat(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto bg-[#E5DDD5] space-y-4">
              {!isPhoneVerified && (
                <div className="bg-white p-4 rounded-2xl shadow-sm text-center space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase">Identificação Necessária</p>
                  <p className="text-sm text-slate-700">Para começar, informe seu número de telefone cadastrado.</p>
                  <input 
                    type="tel" 
                    placeholder="(00) 00000-0000"
                    id="phone-input"
                    className="w-full p-2 border border-slate-200 rounded-lg text-center outline-none focus:ring-2 focus:ring-[#075E54]"
                  />
                  <button 
                    onClick={() => {
                      const phone = (document.getElementById('phone-input') as HTMLInputElement).value;
                      if (phone.length >= 10) {
                        setUserPhone(phone);
                        setIsPhoneVerified(true);
                        setChatMessages([...chatMessages, { text: `Telefone ${phone} verificado com sucesso! Como posso ajudar?`, isUser: false }]);
                      }
                    }}
                    className="w-full py-2 bg-[#075E54] text-white rounded-lg font-bold text-sm"
                  >
                    VERIFICAR
                  </button>
                </div>
              )}
              {isPhoneVerified && chatMessages.map((msg, i) => (
                <div key={i} className={cn(
                  "max-w-[80%] p-3 rounded-2xl text-sm shadow-sm",
                  msg.isUser ? "bg-[#DCF8C6] ml-auto rounded-tr-none" : "bg-white mr-auto rounded-tl-none"
                )}>
                  {msg.text}
                </div>
              ))}
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && chatInput) {
                    const userMsg = chatInput;
                    setChatMessages([...chatMessages, { text: userMsg, isUser: true }]);
                    setChatInput('');
                    
                    // Simulate AI Response
                    setTimeout(() => {
                      setChatMessages(prev => [...prev, { text: "Entendido! Processando seu lançamento...", isUser: false }]);
                      setActiveTab('launch');
                      setShowWhatsAppChat(false);
                      handleAiParse(userMsg);
                    }, 1000);
                  }
                }}
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-[#075E54]"
              />
              <button 
                onClick={() => {
                  if (!chatInput) return;
                  const userMsg = chatInput;
                  setChatMessages([...chatMessages, { text: userMsg, isUser: true }]);
                  setChatInput('');
                  setTimeout(() => {
                    setChatMessages(prev => [...prev, { text: "Entendido! Processando seu lançamento...", isUser: false }]);
                    setActiveTab('launch');
                    setShowWhatsAppChat(false);
                    handleAiParse(userMsg);
                  }, 1000);
                }}
                className="bg-[#075E54] text-white p-2 rounded-full"
              >
                <Send size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WhatsApp Simulation Modal */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-50">
        <AnimatePresence>
          {activeTab !== 'launch' && (
            <motion.button 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={() => setActiveTab('launch')}
              className="md:hidden w-16 h-16 bg-agro-green text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
            >
              <PlusCircle size={32} />
            </motion.button>
          )}
        </AnimatePresence>
        
        <button 
          onClick={() => {
            if (subscriptionLevel === 'basico') {
              alert("O acesso ao WhatsApp AI está disponível apenas nos planos Normal e Platina. Faça o upgrade agora!");
              setShowSubscription(true);
              return;
            }
            setShowWhatsAppChat(!showWhatsAppChat);
          }}
          className="w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all ring-4 ring-white"
          title="Simular WhatsApp"
        >
          <MessageSquare size={24} />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            1
          </div>
        </button>
      </div>
    </div>
  );
}