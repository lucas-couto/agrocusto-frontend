-- Initial schema for AgroCusto.
-- Conventions: UUID PKs, timestamptz for timestamps, RLS enabled on every public table.

-- =============================================================================
-- ENUMS
-- =============================================================================

create type status_assinatura as enum ('trial', 'active', 'blocked');
create type nivel_assinatura as enum ('basico', 'normal', 'platina');
create type pref_unidade_area as enum ('ha', 'alqueire_sp', 'alqueire_mg', 'alqueire_ba');
create type categoria_lancamento as enum (
  'diesel', 'semente', 'fertilizante', 'mao_de_obra', 'manutencao', 'outros'
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- 1:1 with auth.users. Holds our domain fields for the authenticated user.
create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null unique,
  telefone text,
  data_cadastro timestamptz not null default now(),
  status_assinatura status_assinatura not null default 'trial',
  nivel_assinatura nivel_assinatura not null default 'basico',
  pref_unidade_area pref_unidade_area not null default 'ha',
  indicado_por uuid references public.usuarios(id) on delete set null
);

create table public.fazendas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  nome text not null,
  hectares_totais numeric(10, 2) not null check (hectares_totais > 0),
  localizacao text,
  created_at timestamptz not null default now()
);

create table public.talhoes (
  id uuid primary key default gen_random_uuid(),
  fazenda_id uuid not null references public.fazendas(id) on delete cascade,
  nome text not null,
  area_ha numeric(10, 2) not null check (area_ha > 0),
  cultura text not null,
  data_plantio date,
  safra text not null,
  created_at timestamptz not null default now()
);

create table public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  talhao_id uuid references public.talhoes(id) on delete set null, -- null = "fazenda toda"
  categoria categoria_lancamento not null,
  valor_total numeric(12, 2) not null check (valor_total > 0),
  data_gasto date not null,
  descricao text not null,
  cultura text not null,
  safra text not null,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

create index idx_fazendas_usuario_id on public.fazendas(usuario_id);
create index idx_talhoes_fazenda_id on public.talhoes(fazenda_id);
create index idx_lancamentos_usuario_id on public.lancamentos(usuario_id);
create index idx_lancamentos_talhao_id on public.lancamentos(talhao_id);
create index idx_lancamentos_safra on public.lancamentos(safra);

-- =============================================================================
-- TRIGGERS: auto-create usuarios row when a new auth user signs up
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, email, nome)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table public.usuarios enable row level security;
alter table public.fazendas enable row level security;
alter table public.talhoes enable row level security;
alter table public.lancamentos enable row level security;

-- usuarios: user can read and update only their own profile.
create policy "usuarios_select_own" on public.usuarios
  for select using (id = auth.uid());

create policy "usuarios_update_own" on public.usuarios
  for update using (id = auth.uid());

-- fazendas: user owns their fazendas.
create policy "fazendas_select_own" on public.fazendas
  for select using (usuario_id = auth.uid());

create policy "fazendas_insert_own" on public.fazendas
  for insert with check (usuario_id = auth.uid());

create policy "fazendas_update_own" on public.fazendas
  for update using (usuario_id = auth.uid());

create policy "fazendas_delete_own" on public.fazendas
  for delete using (usuario_id = auth.uid());

-- talhoes: access is granted via ownership of the parent fazenda.
create policy "talhoes_select_own" on public.talhoes
  for select using (
    exists (
      select 1 from public.fazendas f
      where f.id = talhoes.fazenda_id and f.usuario_id = auth.uid()
    )
  );

create policy "talhoes_insert_own" on public.talhoes
  for insert with check (
    exists (
      select 1 from public.fazendas f
      where f.id = talhoes.fazenda_id and f.usuario_id = auth.uid()
    )
  );

create policy "talhoes_update_own" on public.talhoes
  for update using (
    exists (
      select 1 from public.fazendas f
      where f.id = talhoes.fazenda_id and f.usuario_id = auth.uid()
    )
  );

create policy "talhoes_delete_own" on public.talhoes
  for delete using (
    exists (
      select 1 from public.fazendas f
      where f.id = talhoes.fazenda_id and f.usuario_id = auth.uid()
    )
  );

-- lancamentos: user owns their own launches.
create policy "lancamentos_select_own" on public.lancamentos
  for select using (usuario_id = auth.uid());

create policy "lancamentos_insert_own" on public.lancamentos
  for insert with check (usuario_id = auth.uid());

create policy "lancamentos_update_own" on public.lancamentos
  for update using (usuario_id = auth.uid());

create policy "lancamentos_delete_own" on public.lancamentos
  for delete using (usuario_id = auth.uid());
