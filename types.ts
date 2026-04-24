export interface Usuario {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  data_cadastro: string;
  status_assinatura: 'trial' | 'active' | 'blocked';
  nivel_assinatura: 'basico' | 'normal' | 'platina';
  pref_unidade_area: 'ha' | 'alqueire_sp' | 'alqueire_mg' | 'alqueire_ba'; // Added for regional units
  id_indicador?: number;
}

export interface Fazenda {
  id: number;
  usuario_id: number;
  nome: string;
  hectares_totais: number;
  localizacao?: string;
}

export interface Talhao {
  id: number;
  fazenda_id: number;
  nome: string;
  area_ha: number;
  cultura: string;
  data_plantio?: string;
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
  id: number;
  usuario_id: number;
  talhao_id: number | null; // null means "Fazenda Toda"
  categoria: string;
  valor_total: number;
  data_gasto: string;
  descricao: string;
  cultura: string; // Added for explicit classification
  safra: string;   // Added for explicit classification
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
  talhao_id?: number | null;
  descricao?: string;
  needsConfirmation: boolean;
  missingContext?: string;
}
