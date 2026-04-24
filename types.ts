import type { Database } from '@/lib/supabase/database.types';

export type StatusAssinatura = Database['public']['Enums']['status_assinatura'];
export type NivelAssinatura = Database['public']['Enums']['nivel_assinatura'];
export type PrefUnidadeArea = Database['public']['Enums']['pref_unidade_area'];
export type CategoriaLancamento = Database['public']['Enums']['categoria_lancamento'];

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  data_cadastro: string;
  status_assinatura: StatusAssinatura;
  nivel_assinatura: NivelAssinatura;
  pref_unidade_area: PrefUnidadeArea;
  indicado_por: string | null;
}

export interface Fazenda {
  id: string;
  usuario_id: string;
  nome: string;
  hectares_totais: number;
  localizacao: string | null;
}

export interface Talhao {
  id: string;
  fazenda_id: string;
  nome: string;
  area_ha: number;
  cultura: string;
  data_plantio: string | null;
  safra: string;
}

export interface SubscriptionPlan {
  id: string;
  name: 'Básico' | 'Normal' | 'Platina';
  price: number;
  period: 'monthly' | 'annual';
  features: string[];
  whatsapp_included: boolean;
  multi_farm: boolean;
}

export interface Lancamento {
  id: string;
  usuario_id: string;
  talhao_id: string | null; // null means "Fazenda Toda"
  categoria: string;
  valor_total: number;
  data_gasto: string;
  descricao: string;
  cultura: string;
  safra: string;
}

export interface Quote {
  id: string;
  commodity: string;
  price: number;
  unit: string;
  change: number;
  lastUpdate: string;
  source: string;
}

export interface AIResponse {
  valor?: number;
  categoria?: string;
  talhao_id?: string | null;
  descricao?: string;
  needsConfirmation: boolean;
  missingContext?: string;
}
