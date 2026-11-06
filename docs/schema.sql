-- ============================================================================
-- ATOS 2 — Esquema PostgreSQL (Supabase) da versão publicada.
-- Mesmo contrato da prévia do claude.ai: os dados de cada pessoa são documentos
-- (coleção + id) em que vale a alteração mais recente (t; desempate pelo aparelho)
-- e a exclusão é uma marca. Assim js/dados.js só troca o adaptador de banco.
-- ============================================================================

-- ---------- Perfis e papéis ----------
create type public.papel_usuario as enum ('leitor', 'editor', 'administrador');

create table public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  papel public.papel_usuario not null default 'leitor',
  criado_em timestamptz not null default now()
);

-- E-mails que recebem papel de edição ao se cadastrar (preenchido pelo administrador)
create table public.convites_papel (
  email text primary key,
  papel public.papel_usuario not null
);

create or replace function public.criar_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, nome, papel)
  values (new.id,
          nullif(new.raw_user_meta_data->>'nome', ''),
          coalesce((select c.papel from public.convites_papel c where lower(c.email) = lower(new.email)), 'leitor'));
  return new;
end $$;
create trigger ao_criar_usuario after insert on auth.users
  for each row execute function public.criar_perfil();

-- Função de papel fica em esquema não exposto pela API
create schema if not exists privado;
revoke all on schema privado from public, anon;
grant usage on schema privado to authenticated;
create or replace function privado.eh_editor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis where id = auth.uid() and papel in ('editor', 'administrador'))
$$;
revoke execute on function privado.eh_editor() from public, anon;
grant execute on function privado.eh_editor() to authenticated;

-- ---------- Dados pessoais (favoritos, destaques, notas, estudos, planos, artes, histórico...) ----------
create table public.documentos_usuario (
  usuario_id uuid not null references auth.users(id) on delete cascade,
  colecao text not null,
  id text not null,
  dados jsonb not null default '{}',
  t bigint not null,                    -- carimbo da alteração (ms): vale o maior
  dev text,                             -- aparelho (desempate)
  excluido boolean not null default false,
  atualizado_em timestamptz not null default now(),
  primary key (usuario_id, colecao, id),
  constraint tamanho_doc check (pg_column_size(dados) < 900000)
);
create index documentos_usuario_sinc on public.documentos_usuario (usuario_id, atualizado_em);

-- Grava só se a versão recebida for mais nova (mesma regra de A2Sinc.vence)
create or replace function public.salvar_documento_usuario(p_colecao text, p_id text, p_dados jsonb, p_t bigint, p_dev text, p_excluido boolean)
returns void language sql security invoker set search_path = public as $$
  insert into public.documentos_usuario (usuario_id, colecao, id, dados, t, dev, excluido)
  values (auth.uid(), p_colecao, p_id, p_dados, p_t, p_dev, p_excluido)
  on conflict (usuario_id, colecao, id) do update
    set dados = excluded.dados, t = excluded.t, dev = excluded.dev, excluido = excluded.excluido, atualizado_em = now()
    where public.documentos_usuario.t < excluded.t
       or (public.documentos_usuario.t = excluded.t and coalesce(public.documentos_usuario.dev, '') < coalesce(excluded.dev, ''));
$$;

-- ---------- Conteúdo editorial (devocionais, reflexões do dia, galeria; rascunhos só para a edição) ----------
create table public.conteudo_editorial (
  area text not null check (area in ('devocionais', 'reflexoes', 'galeria', 'rascunhos')),
  id text not null,
  dados jsonb not null default '{}',
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid references auth.users(id) default auth.uid(),
  primary key (area, id),
  -- devocional de IA só pode ser publicado com revisão registrada
  constraint ia_revisada check (area <> 'devocionais' or coalesce(dados->>'origem', '') <> 'ia' or coalesce(dados->>'revisadoEm', '') <> '')
);

-- ---------- Segurança (RLS) ----------
alter table public.perfis enable row level security;
alter table public.convites_papel enable row level security;
alter table public.documentos_usuario enable row level security;
alter table public.conteudo_editorial enable row level security;

create policy perfil_ler on public.perfis for select to authenticated using (id = (select auth.uid()));
create policy perfil_nome on public.perfis for update to authenticated using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and papel = (select p.papel from public.perfis p where p.id = (select auth.uid())));
-- convites_papel: sem políticas (só o administrador, pelo painel/SQL)

create policy dados_proprios on public.documentos_usuario for all to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));

create policy conteudo_publico on public.conteudo_editorial for select to anon using (area <> 'rascunhos');
create policy conteudo_leitura on public.conteudo_editorial for select to authenticated
  using (area <> 'rascunhos' or (select privado.eh_editor()));
create policy conteudo_inserir on public.conteudo_editorial for insert to authenticated with check ((select privado.eh_editor()));
create policy conteudo_alterar on public.conteudo_editorial for update to authenticated using ((select privado.eh_editor())) with check ((select privado.eh_editor()));
create policy conteudo_excluir on public.conteudo_editorial for delete to authenticated using ((select privado.eh_editor()));
create index conteudo_editorial_atualizado_por on public.conteudo_editorial (atualizado_por);

revoke execute on function public.criar_perfil() from anon, authenticated, public;
revoke execute on function public.salvar_documento_usuario(text, text, jsonb, bigint, text, boolean) from public, anon;
grant execute on function public.salvar_documento_usuario(text, text, jsonb, bigint, text, boolean) to authenticated;

-- ---------- Tempo real ----------
alter publication supabase_realtime add table public.documentos_usuario, public.conteudo_editorial;
