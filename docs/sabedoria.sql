-- ATOS 2 — Jornada da Sabedoria (gamificação do quiz bíblico)
-- Pontos, níveis, medalhas e dias seguidos são calculados SÓ no servidor, pela função
-- public.sabedoria_registrar_rodada. As tabelas de progresso não aceitam escrita direta do aplicativo:
-- RLS permite apenas que cada pessoa leia as próprias linhas.

-- ---------------------------------------------------------------- banco de perguntas (expansível)
create table if not exists public.sabedoria_perguntas (
  id text primary key,
  secao text not null,
  tema text not null,
  dificuldade smallint not null check (dificuldade between 1 and 4),
  formato text not null check (formato in ('multipla','vf','complete','quem-sou-eu','identifique','qual-livro','relacione','referencia')),
  resposta text not null,
  dados jsonb not null,                       -- a pergunta completa, no mesmo formato de app/quiz/*.json
  origem text not null default 'editor',      -- 'app' = veio dos arquivos do aplicativo; 'editor' = acrescentada no banco
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
create index if not exists sabedoria_perguntas_secao on public.sabedoria_perguntas (secao, dificuldade);
alter table public.sabedoria_perguntas enable row level security;
drop policy if exists "perguntas ativas são públicas" on public.sabedoria_perguntas;
create policy "perguntas ativas são públicas" on public.sabedoria_perguntas for select to anon, authenticated using (ativo);
drop policy if exists "editores mantêm as perguntas" on public.sabedoria_perguntas;
create policy "editores mantêm as perguntas" on public.sabedoria_perguntas for all to authenticated
  using ((select privado.eh_editor())) with check ((select privado.eh_editor()));

-- ---------------------------------------------------------------- desafios especiais (pontuação configurável)
create table if not exists public.sabedoria_desafios (
  id text primary key,
  titulo text not null,
  descricao text not null default '',
  pontos int not null check (pontos between 1 and 500),
  perguntas int not null check (perguntas between 1 and 15),
  min_acertos int not null default 0,
  secoes text[],
  dificuldade_min smallint,
  periodo text not null default 'dia' check (periodo in ('dia','unico')),
  inicio date, fim date,
  ativo boolean not null default true
);
alter table public.sabedoria_desafios enable row level security;
drop policy if exists "desafios ativos são públicos" on public.sabedoria_desafios;
create policy "desafios ativos são públicos" on public.sabedoria_desafios for select to anon, authenticated using (ativo);
drop policy if exists "editores mantêm os desafios" on public.sabedoria_desafios;
create policy "editores mantêm os desafios" on public.sabedoria_desafios for all to authenticated
  using ((select privado.eh_editor())) with check ((select privado.eh_editor()));
insert into public.sabedoria_desafios (id, titulo, descricao, pontos, perguntas, min_acertos, secoes, dificuldade_min, periodo) values
  ('desafio-do-dia', 'Desafio do dia', '5 perguntas iguais para todos hoje.', 25, 5, 3, null, null, 'dia'),
  ('profetas', 'Desafio dos Profetas', '10 perguntas dos profetas maiores e menores. Acerte 8 para conquistar.', 50, 10, 8, array['profetas-maiores','profetas-menores'], 2, 'unico'),
  ('evangelhos', 'Desafio dos Evangelhos', '10 perguntas de Mateus, Marcos, Lucas e João. Acerte 8 para conquistar.', 50, 10, 8, array['evangelhos'], 2, 'unico')
on conflict (id) do nothing;

-- ---------------------------------------------------------------- progresso de cada pessoa
create table if not exists public.sabedoria (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  pontos int not null default 0 check (pontos >= 0),
  nivel smallint not null default 1 check (nivel between 1 and 8),
  iniciado_em timestamptz not null default now(),
  rodadas int not null default 0, respondidas int not null default 0, acertos int not null default 0,
  seq_atual int not null default 0, seq_max int not null default 0,
  dias_seguidos int not null default 0, maior_dias int not null default 0, ultimo_dia date,
  medalhas jsonb not null default '{}', especiais jsonb not null default '{}', diario jsonb not null default '{}',
  atualizado_em timestamptz not null default now()
);
create table if not exists public.sabedoria_respostas (
  usuario_id uuid not null references auth.users (id) on delete cascade,
  pergunta_id text not null references public.sabedoria_perguntas (id) on delete cascade,
  secao text not null,
  acertos int not null default 0, erros int not null default 0,
  primeira_certa_em timestamptz, ultima_em date,
  primary key (usuario_id, pergunta_id)
);
create index if not exists sabedoria_respostas_pergunta on public.sabedoria_respostas (pergunta_id);
create table if not exists public.sabedoria_rodadas (
  id uuid primary key,                        -- gerado pelo aparelho: reenviar a mesma rodada é recusado
  usuario_id uuid not null references auth.users (id) on delete cascade,
  modo text not null, especial text, dia date not null,
  perguntas text[] not null, acertos int not null, total int not null, pontos int not null, ganhos jsonb not null,
  criado_em timestamptz not null default now()
);
create index if not exists sabedoria_rodadas_usuario on public.sabedoria_rodadas (usuario_id, dia);
create table if not exists public.sabedoria_eventos (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('rodada','nivel','medalha')),
  dados jsonb not null default '{}',
  criado_em timestamptz not null default now()
);
create index if not exists sabedoria_eventos_usuario on public.sabedoria_eventos (usuario_id, id desc);

alter table public.sabedoria enable row level security;
alter table public.sabedoria_respostas enable row level security;
alter table public.sabedoria_rodadas enable row level security;
alter table public.sabedoria_eventos enable row level security;
drop policy if exists "lê o próprio progresso" on public.sabedoria;
create policy "lê o próprio progresso" on public.sabedoria for select to authenticated using ((select auth.uid()) = usuario_id);
drop policy if exists "lê as próprias respostas" on public.sabedoria_respostas;
create policy "lê as próprias respostas" on public.sabedoria_respostas for select to authenticated using ((select auth.uid()) = usuario_id);
drop policy if exists "lê as próprias rodadas" on public.sabedoria_rodadas;
create policy "lê as próprias rodadas" on public.sabedoria_rodadas for select to authenticated using ((select auth.uid()) = usuario_id);
drop policy if exists "lê os próprios eventos" on public.sabedoria_eventos;
create policy "lê os próprios eventos" on public.sabedoria_eventos for select to authenticated using ((select auth.uid()) = usuario_id);
-- nenhuma política de insert/update/delete: só as funções abaixo escrevem
revoke insert, update, delete on public.sabedoria, public.sabedoria_respostas, public.sabedoria_rodadas, public.sabedoria_eventos from anon, authenticated;

-- ---------------------------------------------------------------- regras (espelho de app/js/nucleo/sabedoria.js)
create or replace function privado.sabedoria_nivel(p int) returns smallint language sql immutable set search_path = '' as $$
  select (case when p >= 2700 then 8 when p >= 1900 then 7 when p >= 1300 then 6 when p >= 850 then 5
               when p >= 500 then 4 when p >= 250 then 3 when p >= 100 then 2 else 1 end)::smallint
$$;

create or replace function public.sabedoria_registrar_rodada(p_id uuid, p_modo text, p_especial text, p_dia date, p_respostas jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_dia date := coalesce(p_dia, (now() at time zone 'America/Sao_Paulo')::date);
  v_agora timestamptz := now();
  v_antigo boolean;
  s public.sabedoria%rowtype;
  v_n int; v_item jsonb; v_q public.sabedoria_perguntas%rowtype; v_prev int;
  v_certo boolean; v_acertos int := 0; v_rseq int := 0; v_pts int; v_pac int := 0; v_novos int := 0; v_seqb int := 0;
  v_ganhos jsonb := '[]'; v_detalhe jsonb := '[]'; v_eventos jsonb := '[]'; v_pontos int;
  v_diario jsonb; v_d jsonb; v_cfg public.sabedoria_desafios%rowtype; v_nivel_antes smallint; v_gap int; v_ok boolean; v_med record;
begin
  if v_uid is null then raise exception 'É preciso entrar na conta.' using errcode = '28000'; end if;
  if p_id is null then raise exception 'Rodada sem identificação.'; end if;
  if p_modo is null or p_modo not in ('livre', 'avancado', 'especial') then raise exception 'Modo de rodada inválido.'; end if;
  if p_respostas is null or jsonb_typeof(p_respostas) <> 'array' then raise exception 'Respostas inválidas.'; end if;
  v_n := jsonb_array_length(p_respostas);
  if v_n = 0 then raise exception 'Rodada sem respostas.'; end if;
  if v_n > 15 then raise exception 'Respostas demais numa só rodada.'; end if;
  if (select count(distinct e->>'p') from jsonb_array_elements(p_respostas) e) <> v_n then raise exception 'Pergunta repetida na rodada.'; end if;
  if (select count(*) from public.sabedoria_perguntas q where q.ativo and q.id in (select e->>'p' from jsonb_array_elements(p_respostas) e)) <> v_n
    then raise exception 'Pergunta desconhecida.'; end if;
  if v_dia > v_hoje + 1 then raise exception 'Data da rodada inválida.'; end if;
  v_antigo := v_dia < v_hoje - 1;
  if exists (select 1 from public.sabedoria_rodadas r where r.id = p_id) then raise exception 'Esta rodada já foi registrada.'; end if;

  insert into public.sabedoria (usuario_id) values (v_uid) on conflict (usuario_id) do nothing;
  select * into s from public.sabedoria where usuario_id = v_uid for update;
  v_nivel_antes := s.nivel;
  v_diario := coalesce(s.diario, '{}'::jsonb);
  v_d := coalesce(v_diario -> v_dia::text, '{"rodadas":0,"conclusoes":0,"sequencias":0,"avancado":false,"especiais":{}}'::jsonb);
  if not v_antigo and (v_d->>'rodadas')::int >= 40 then raise exception 'Limite de rodadas do dia atingido. Volte amanhã!'; end if;
  v_d := jsonb_set(v_d, '{rodadas}', to_jsonb((v_d->>'rodadas')::int + 1));

  for v_item in select e.value from jsonb_array_elements(p_respostas) as e loop
    select * into v_q from public.sabedoria_perguntas q where q.id = v_item->>'p';
    v_certo := (v_item->>'r') = v_q.resposta;
    v_pts := 0;
    s.respondidas := s.respondidas + 1;
    select r.acertos into v_prev from public.sabedoria_respostas r where r.usuario_id = v_uid and r.pergunta_id = v_q.id;
    if not found then v_prev := 0; end if;
    if v_certo then
      v_acertos := v_acertos + 1; s.acertos := s.acertos + 1; v_rseq := v_rseq + 1;
      s.seq_atual := s.seq_atual + 1; s.seq_max := greatest(s.seq_max, s.seq_atual);
      if v_prev = 0 then v_pts := v_pts + 10; v_pac := v_pac + 10; v_novos := v_novos + 1; end if;
      if v_rseq % 5 = 0 and not v_antigo and (v_d->>'sequencias')::int < 6 then
        v_d := jsonb_set(v_d, '{sequencias}', to_jsonb((v_d->>'sequencias')::int + 1));
        v_seqb := v_seqb + 1; v_pts := v_pts + 15;
      end if;
    else
      v_rseq := 0; s.seq_atual := 0;
    end if;
    insert into public.sabedoria_respostas as r (usuario_id, pergunta_id, secao, acertos, erros, primeira_certa_em, ultima_em)
      values (v_uid, v_q.id, v_q.secao, case when v_certo then 1 else 0 end, case when v_certo then 0 else 1 end,
              case when v_certo then v_agora end, v_dia)
      on conflict (usuario_id, pergunta_id) do update set acertos = r.acertos + excluded.acertos, erros = r.erros + excluded.erros,
        primeira_certa_em = coalesce(r.primeira_certa_em, excluded.primeira_certa_em), ultima_em = excluded.ultima_em, secao = excluded.secao;
    v_detalhe := v_detalhe || jsonb_build_object('p', v_q.id, 'certo', v_certo, 'pontos', v_pts);
  end loop;

  if v_pac > 0 then v_ganhos := v_ganhos || jsonb_build_object('tipo', 'acerto', 'pontos', v_pac,
    'rotulo', v_novos || case when v_novos = 1 then ' acerto inédito' else ' acertos inéditos' end); end if;
  if v_seqb > 0 then v_ganhos := v_ganhos || jsonb_build_object('tipo', 'sequencia', 'pontos', v_seqb * 15,
    'rotulo', case when v_seqb = 1 then '5 acertos seguidos' else v_seqb || ' sequências de 5 acertos' end); end if;
  if v_n >= 5 then
    s.rodadas := s.rodadas + 1;
    if not v_antigo and (v_d->>'conclusoes')::int < 5 then
      v_d := jsonb_set(v_d, '{conclusoes}', to_jsonb((v_d->>'conclusoes')::int + 1));
      v_ganhos := v_ganhos || '{"tipo":"conclusao","pontos":20,"rotulo":"Quiz concluído"}'::jsonb;
    end if;
  end if;
  if p_modo = 'avancado' and not v_antigo and not (v_d->>'avancado')::boolean and v_n = 10 and v_acertos >= 7
     and not exists (select 1 from jsonb_array_elements(p_respostas) e join public.sabedoria_perguntas q on q.id = e->>'p' where q.dificuldade < 3) then
    v_d := jsonb_set(v_d, '{avancado}', 'true'::jsonb);
    v_ganhos := v_ganhos || '{"tipo":"avancado","pontos":30,"rotulo":"Desafio avançado"}'::jsonb;
  end if;
  if p_modo = 'especial' and not v_antigo then
    select * into v_cfg from public.sabedoria_desafios d where d.id = p_especial and d.ativo
      and (d.inicio is null or d.inicio <= v_dia) and (d.fim is null or d.fim >= v_dia);
    if found then
      v_ok := not (case when v_cfg.periodo = 'unico' then s.especiais ? v_cfg.id else coalesce(v_d->'especiais', '{}'::jsonb) ? v_cfg.id end)
        and v_n = v_cfg.perguntas and v_acertos >= v_cfg.min_acertos
        and not exists (select 1 from jsonb_array_elements(p_respostas) e join public.sabedoria_perguntas q on q.id = e->>'p'
          where (v_cfg.secoes is not null and not (q.secao = any (v_cfg.secoes))) or (v_cfg.dificuldade_min is not null and q.dificuldade < v_cfg.dificuldade_min));
      if v_ok then
        v_d := jsonb_set(v_d, '{especiais}', coalesce(v_d->'especiais', '{}'::jsonb) || jsonb_build_object(v_cfg.id, true));
        if v_cfg.periodo = 'unico' then s.especiais := s.especiais || jsonb_build_object(v_cfg.id, v_dia); end if;
        v_ganhos := v_ganhos || jsonb_build_object('tipo', 'especial', 'pontos', v_cfg.pontos, 'rotulo', v_cfg.titulo);
      end if;
    end if;
  end if;
  if v_n >= 5 and not v_antigo then
    if s.ultimo_dia is null then s.dias_seguidos := 1;
    else
      v_gap := v_dia - s.ultimo_dia;
      if v_gap = 1 then s.dias_seguidos := s.dias_seguidos + 1; elsif v_gap > 1 then s.dias_seguidos := 1; end if;
    end if;
    if s.ultimo_dia is null or v_dia > s.ultimo_dia then s.ultimo_dia := v_dia; end if;
    s.maior_dias := greatest(s.maior_dias, s.dias_seguidos);
  end if;

  select coalesce(sum((g->>'pontos')::int), 0) into v_pontos from jsonb_array_elements(v_ganhos) g;
  s.pontos := s.pontos + v_pontos;
  s.nivel := greatest(s.nivel, privado.sabedoria_nivel(s.pontos));
  v_diario := v_diario || jsonb_build_object(v_dia::text, v_d);
  select coalesce(jsonb_object_agg(t.k, t.v), '{}'::jsonb) into v_diario from jsonb_each(v_diario) as t(k, v) where t.k::date >= v_hoje - 2;

  insert into public.sabedoria_rodadas (id, usuario_id, modo, especial, dia, perguntas, acertos, total, pontos, ganhos)
    values (p_id, v_uid, p_modo, p_especial, v_dia, array(select e->>'p' from jsonb_array_elements(p_respostas) e), v_acertos, v_n, v_pontos, v_ganhos);
  insert into public.sabedoria_eventos (usuario_id, tipo, dados)
    values (v_uid, 'rodada', jsonb_build_object('modo', p_modo, 'pontos', v_pontos, 'acertos', v_acertos, 'total', v_n));
  if s.nivel > v_nivel_antes then
    v_eventos := v_eventos || jsonb_build_object('tipo', 'nivel', 'de', v_nivel_antes, 'para', s.nivel);
    insert into public.sabedoria_eventos (usuario_id, tipo, dados) values (v_uid, 'nivel', jsonb_build_object('nivel', s.nivel));
  end if;
  for v_med in select m.id, m.ok from (values
      ('primeiro-passo', s.rodadas >= 1), ('mente-atenta', s.seq_max >= 10), ('estudioso', s.rodadas >= 50), ('conhecedor', s.acertos >= 100),
      ('perseverante', s.maior_dias >= 7), ('dedicado', s.maior_dias >= 30), ('guardiao', s.nivel >= 8)) as m(id, ok) loop
    if v_med.ok and not (s.medalhas ? v_med.id) then
      s.medalhas := s.medalhas || jsonb_build_object(v_med.id, v_agora);
      v_eventos := v_eventos || jsonb_build_object('tipo', 'medalha', 'id', v_med.id);
      insert into public.sabedoria_eventos (usuario_id, tipo, dados) values (v_uid, 'medalha', jsonb_build_object('id', v_med.id));
    end if;
  end loop;

  update public.sabedoria set pontos = s.pontos, nivel = s.nivel, rodadas = s.rodadas, respondidas = s.respondidas, acertos = s.acertos,
    seq_atual = s.seq_atual, seq_max = s.seq_max, dias_seguidos = s.dias_seguidos, maior_dias = s.maior_dias, ultimo_dia = s.ultimo_dia,
    medalhas = s.medalhas, especiais = s.especiais, diario = v_diario, atualizado_em = v_agora
  where usuario_id = v_uid;

  return jsonb_build_object('pontos', v_pontos, 'ganhos', v_ganhos, 'eventos', v_eventos, 'detalhe', v_detalhe,
    'acertos', v_acertos, 'total', v_n, 'estado', public.sabedoria_estado());
end $$;

-- Estado completo da pessoa numa só chamada (lida com a RLS de quem chama; sem limite de linhas da API).
create or replace function public.sabedoria_estado() returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'linha', (select to_jsonb(s) - 'usuario_id' from public.sabedoria s where s.usuario_id = (select auth.uid())),
    'respostas', coalesce((select jsonb_agg(jsonb_build_object('pergunta_id', r.pergunta_id, 'acertos', r.acertos, 'erros', r.erros, 'ultima_em', r.ultima_em, 'secao', r.secao))
                           from public.sabedoria_respostas r where r.usuario_id = (select auth.uid())), '[]'::jsonb),
    'eventos', coalesce((select jsonb_agg(x order by x.id desc) from (select e.id, e.tipo, e.dados, e.criado_em from public.sabedoria_eventos e
                           where e.usuario_id = (select auth.uid()) order by e.id desc limit 60) x), '[]'::jsonb))
$$;

revoke all on function public.sabedoria_registrar_rodada(uuid, text, text, date, jsonb) from public, anon;
grant execute on function public.sabedoria_registrar_rodada(uuid, text, text, date, jsonb) to authenticated;
revoke all on function public.sabedoria_estado() from public, anon;
grant execute on function public.sabedoria_estado() to authenticated;
revoke all on function privado.sabedoria_nivel(int) from public, anon, authenticated;

-- Carga inicial (06/11/2026): as 1.087 perguntas de app/quiz/*.json foram inseridas com origem = 'app'
-- (lidas do repositório público com a extensão http, removida em seguida). Para recarregar depois de
-- rodar ferramentas/quiz/gerar.js, use o mesmo insert ... on conflict (id) do update.
