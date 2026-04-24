export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string;
          nome: string;
          email: string;
          telefone: string | null;
          data_cadastro: string;
          status_assinatura: Database['public']['Enums']['status_assinatura'];
          nivel_assinatura: Database['public']['Enums']['nivel_assinatura'];
          pref_unidade_area: Database['public']['Enums']['pref_unidade_area'];
          indicado_por: string | null;
        };
        Insert: {
          id: string;
          nome: string;
          email: string;
          telefone?: string | null;
          data_cadastro?: string;
          status_assinatura?: Database['public']['Enums']['status_assinatura'];
          nivel_assinatura?: Database['public']['Enums']['nivel_assinatura'];
          pref_unidade_area?: Database['public']['Enums']['pref_unidade_area'];
          indicado_por?: string | null;
        };
        Update: {
          id?: string;
          nome?: string;
          email?: string;
          telefone?: string | null;
          data_cadastro?: string;
          status_assinatura?: Database['public']['Enums']['status_assinatura'];
          nivel_assinatura?: Database['public']['Enums']['nivel_assinatura'];
          pref_unidade_area?: Database['public']['Enums']['pref_unidade_area'];
          indicado_por?: string | null;
        };
      };
      fazendas: {
        Row: {
          id: string;
          usuario_id: string;
          nome: string;
          hectares_totais: number;
          localizacao: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          usuario_id: string;
          nome: string;
          hectares_totais: number;
          localizacao?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          usuario_id?: string;
          nome?: string;
          hectares_totais?: number;
          localizacao?: string | null;
          created_at?: string;
        };
      };
      talhoes: {
        Row: {
          id: string;
          fazenda_id: string;
          nome: string;
          area_ha: number;
          cultura: string;
          data_plantio: string | null;
          safra: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          fazenda_id: string;
          nome: string;
          area_ha: number;
          cultura: string;
          data_plantio?: string | null;
          safra: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          fazenda_id?: string;
          nome?: string;
          area_ha?: number;
          cultura?: string;
          data_plantio?: string | null;
          safra?: string;
          created_at?: string;
        };
      };
      lancamentos: {
        Row: {
          id: string;
          usuario_id: string;
          talhao_id: string | null;
          categoria: Database['public']['Enums']['categoria_lancamento'];
          valor_total: number;
          data_gasto: string;
          descricao: string;
          cultura: string;
          safra: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          usuario_id: string;
          talhao_id?: string | null;
          categoria: Database['public']['Enums']['categoria_lancamento'];
          valor_total: number;
          data_gasto: string;
          descricao: string;
          cultura: string;
          safra: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          usuario_id?: string;
          talhao_id?: string | null;
          categoria?: Database['public']['Enums']['categoria_lancamento'];
          valor_total?: number;
          data_gasto?: string;
          descricao?: string;
          cultura?: string;
          safra?: string;
          created_at?: string;
        };
      };
    };
    Enums: {
      status_assinatura: 'trial' | 'active' | 'blocked';
      nivel_assinatura: 'basico' | 'normal' | 'platina';
      pref_unidade_area: 'ha' | 'alqueire_sp' | 'alqueire_mg' | 'alqueire_ba';
      categoria_lancamento:
        | 'diesel'
        | 'semente'
        | 'fertilizante'
        | 'mao_de_obra'
        | 'manutencao'
        | 'outros';
    };
  };
};
