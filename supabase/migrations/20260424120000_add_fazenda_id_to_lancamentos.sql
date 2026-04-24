-- Add fazenda_id to lancamentos so every launch knows which fazenda it belongs to.
-- Previously launches only pointed to a talhão; "Fazenda Toda" launches (talhao_id = null)
-- had no fazenda reference, and deleting a fazenda left lancamentos as orphans because
-- talhao_id had ON DELETE SET NULL.

-- 1. Add as nullable for backfill
alter table public.lancamentos
  add column fazenda_id uuid references public.fazendas(id) on delete cascade;

-- 2. Backfill for lancamentos that have a talhao
update public.lancamentos l
set fazenda_id = t.fazenda_id
from public.talhoes t
where l.talhao_id = t.id;

-- 3. Drop orphan lancamentos (talhao_id null AND no known fazenda)
delete from public.lancamentos where fazenda_id is null;

-- 4. Now enforce NOT NULL
alter table public.lancamentos alter column fazenda_id set not null;

-- 5. Index for common filter
create index idx_lancamentos_fazenda_id on public.lancamentos(fazenda_id);
