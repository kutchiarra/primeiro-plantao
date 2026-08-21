-- =====================================================================
-- Primeiro Plantão — schema inicial (Supabase / Postgres)
-- Ordem de execução: tipos -> identidade -> catálogos -> conteúdo clínico
--                    -> runtime -> avaliação -> RLS -> RPCs
-- =====================================================================

create extension if not exists pgcrypto;

-- ------------------------------ TIPOS --------------------------------
create type plan_tier      as enum ('free','premium','institucional');
create type case_level     as enum ('n1_ambulatorio','n2_urgencia','n3_pronto_socorro','n4_emergencia','n5_uti_pcr');
create type order_type     as enum ('lab','imagem','procedimento');
create type session_status as enum ('em_andamento','encerrada','abandonada','expirada');
create type expectativa    as enum ('esperado','aceitavel','desnecessario','contraindicado');
create type severidade     as enum ('critico','importante','refinamento');
create type pilar          as enum ('anamnese','investigacao','conduta','soft_skills');

-- ------------------- 1. IDENTIDADE E ASSINATURA ----------------------
create table profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  nome               text not null,
  crm                text,
  ano_formatura      int,
  especialidade_alvo text,
  nivel_liberado     case_level not null default 'n1_ambulatorio',
  xp                 int not null default 0,
  onboarding_em      timestamptz,
  criado_em          timestamptz not null default now()
);

create table subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null unique references profiles(id) on delete cascade,
  tier                     plan_tier not null default 'free',
  status                   text not null default 'active',  -- active | past_due | canceled
  provider                 text not null default 'stripe',
  provider_customer_id     text,
  provider_subscription_id text,
  periodo_fim              timestamptz,
  atualizado_em            timestamptz not null default now()
);

-- Cota do freemium + teto de custo de LLM por usuário/mês
create table usage_counters (
  user_id           uuid references profiles(id) on delete cascade,
  competencia       date not null,               -- sempre dia 1 do mês
  sessoes_iniciadas int not null default 0,
  tokens_llm        bigint not null default 0,
  custo_llm_cents   int not null default 0,
  primary key (user_id, competencia)
);

-- --------------------------- 2. CATÁLOGOS ----------------------------
-- Globais, existem independentemente do caso. O custo alimenta o motor de
-- gestão de recursos; o turnaround alimenta o relógio da simulação.
create table lab_tests (
  id             uuid primary key default gen_random_uuid(),
  codigo         text unique not null,
  nome           text not null,
  grupo          text not null,          -- Hematologia, Bioquímica, Marcadores...
  unidade        text,
  ref_min        numeric,
  ref_max        numeric,
  turnaround_min int not null default 30,
  custo_cents    int not null default 0,
  invasividade   smallint not null default 1   -- 1 baixa ... 5 alta
);

create table imaging_studies (
  id             uuid primary key default gen_random_uuid(),
  codigo         text unique not null,
  nome           text not null,
  modalidade     text not null,          -- RX, TC, RM, USG, Cateterismo...
  turnaround_min int not null default 45,
  custo_cents    int not null default 0,
  radiacao_msv   numeric default 0,
  usa_contraste  boolean default false
);

create table medications (
  id          uuid primary key default gen_random_uuid(),
  codigo      text unique not null,
  nome        text not null,
  classe      text,
  vias        text[] not null default '{}',
  dose_padrao text,
  custo_cents int not null default 0
);

-- ----------------------- 3. CONTEÚDO CLÍNICO -------------------------
create table cases (
  id                   uuid primary key default gen_random_uuid(),
  codigo               text unique not null,       -- 'PS-DT-001'
  titulo               text not null,
  resumo               text,
  nivel                case_level not null,
  especialidades       text[] not null default '{}',
  diagnostico_final    text not null,              -- NUNCA vai para o client
  diferenciais         text[] not null default '{}',
  tempo_alvo_min       int,                        -- janela terapêutica do caso
  is_free              boolean not null default false,
  publicado            boolean not null default false,
  versao               int not null default 1,
  referencia_guideline text,
  revisado_por         text,
  criado_em            timestamptz not null default now()
);

-- Tudo que o agente-paciente pode saber. Nada aqui revela o diagnóstico.
create table case_personas (
  case_id          uuid primary key references cases(id) on delete cascade,
  nome             text not null,
  idade            int not null,
  sexo             text not null,
  ocupacao         text,
  escolaridade     text,
  fala             jsonb not null default '{}',   -- registro, sotaque, bordoes
  queixa_inicial   text not null,
  roteiro_hpma     jsonb not null default '{}',   -- respostas por tema (OPQRST etc.)
  segredos         jsonb not null default '[]',   -- so revela se perguntado
  estado_emocional text,
  voz              jsonb not null default '{}'    -- provider, voice_id, pitch
);

-- Sinais vitais por fase do caso (t0, pós-tratamento, deterioração)
create table case_vitals (
  id           uuid primary key default gen_random_uuid(),
  case_id      uuid not null references cases(id) on delete cascade,
  fase         text not null,
  t_offset_min int not null default 0,
  hr int, spo2 int, rr int, bp_sys int, bp_dia int,
  temp numeric(3,1), etco2 int, ritmo text
);

create table case_exam_findings (
  id      uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  regiao  text not null,        -- torax, abdome, neuro...
  tecnica text not null,        -- inspecao, palpacao, ausculta, percussao
  achado  text not null,
  anormal boolean not null default false
);

-- GABARITOS: as tabelas abaixo nunca são expostas ao browser.
create table case_lab_results (
  case_id     uuid not null references cases(id) on delete cascade,
  lab_test_id uuid not null references lab_tests(id),
  valor       text not null,
  flag        text,                       -- normal | alto | baixo | critico
  indicado    boolean not null default false,
  peso        int not null default 1,
  primary key (case_id, lab_test_id)
);

create table case_imaging_results (
  case_id          uuid not null references cases(id) on delete cascade,
  imaging_study_id uuid not null references imaging_studies(id),
  laudo            text not null,
  imagem_url       text,
  indicado         boolean not null default false,
  peso             int not null default 1,
  primary key (case_id, imaging_study_id)
);

create table case_treatments (
  case_id       uuid not null references cases(id) on delete cascade,
  medication_id uuid not null references medications(id),
  via           text,
  dose          text,
  classificacao expectativa not null,
  peso          int not null default 1,
  janela_min    int,                         -- prazo para valer peso cheio
  efeito        jsonb not null default '{}', -- {"hr":-12,"bp_sys":10,"dor":-3}
  explicacao    text not null,               -- usado no debriefing
  primary key (case_id, medication_id)
);

-- ------------------------ 4. RUNTIME DA SESSÃO -----------------------
create table sessions (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references profiles(id) on delete cascade,
  case_id               uuid not null references cases(id),
  status                session_status not null default 'em_andamento',
  iniciada_em           timestamptz not null default now(),
  encerrada_em          timestamptz,
  tempo_simulado_s      int not null default 0,
  custo_acumulado_cents int not null default 0,
  hipotese_final        text,
  plano_final           text,
  score_total           int,
  tier_no_inicio        plan_tier not null default 'free'
);
create index on sessions (user_id, iniciada_em desc);

create table session_messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  papel      text not null,             -- medico | paciente | preceptor | sistema
  conteudo   text not null,
  audio_url  text,
  t_offset_s int not null default 0,
  tokens_in int, tokens_out int, custo_cents int,
  criado_em  timestamptz not null default now()
);
create index on session_messages (session_id, t_offset_s);

create table session_orders (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references sessions(id) on delete cascade,
  tipo             order_type not null,
  lab_test_id      uuid references lab_tests(id),
  imaging_study_id uuid references imaging_studies(id),
  justificativa    text,                       -- opcional: reduz a penalidade
  custo_cents      int not null default 0,
  solicitado_em_s  int not null,
  pronto_em_s      int not null,
  visualizado_em_s int,
  check (num_nonnulls(lab_test_id, imaging_study_id) = 1)
);

create table session_prescriptions (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid not null references sessions(id) on delete cascade,
  medication_id     uuid not null references medications(id),
  dose text, via text,
  administrado_em_s int not null,
  efeito_aplicado   jsonb not null default '{}'
);

create table session_exams (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  regiao     text not null,
  tecnica    text not null,
  t_offset_s int not null
);

create table session_vitals (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  t_offset_s int not null,
  hr int, spo2 int, rr int, bp_sys int, bp_dia int, temp numeric(3,1), etco2 int,
  origem     text not null default 'motor'   -- motor | tratamento | evento
);

create table session_events (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  tipo       text not null,                  -- deterioracao, alarme, familiar_chega...
  payload    jsonb not null default '{}',
  t_offset_s int not null
);

-- --------------------- 5. AVALIAÇÃO E APRENDIZADO --------------------
create table debriefs (
  session_id          uuid primary key references sessions(id) on delete cascade,
  score_anamnese      int not null,
  score_investigacao  int not null,
  score_conduta       int not null,
  score_soft_skills   int not null,
  score_total         int not null,
  tempo_ate_conduta_s int,
  custo_total_cents   int not null default 0,
  narrativa_md        text not null,
  modelo              text,
  gerado_em           timestamptz not null default now()
);

create table micro_lessons (
  id        uuid primary key default gen_random_uuid(),
  slug      text unique not null,
  titulo    text not null,
  corpo_md  text not null,
  duracao_s int not null default 90,
  fonte     text,                          -- guideline + ano
  tags      text[] not null default '{}'
);

create table debrief_findings (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references sessions(id) on delete cascade,
  pilar           pilar not null,
  severidade      severidade not null,
  titulo          text not null,
  descricao       text not null,
  evidencia       jsonb not null default '{}',  -- {"message_id":"...","t":214}
  micro_lesson_id uuid references micro_lessons(id)
);

create table lesson_deliveries (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references profiles(id) on delete cascade,
  micro_lesson_id    uuid not null references micro_lessons(id),
  session_id         uuid references sessions(id) on delete set null,
  entregue_em        timestamptz not null default now(),
  concluida_em       timestamptz,
  proxima_revisao_em date                    -- repetição espaçada leve
);

-- ------------------------------- 6. RLS ------------------------------
alter table profiles              enable row level security;
alter table subscriptions         enable row level security;
alter table usage_counters        enable row level security;
alter table sessions              enable row level security;
alter table session_messages      enable row level security;
alter table session_orders        enable row level security;
alter table session_prescriptions enable row level security;
alter table session_exams         enable row level security;
alter table session_vitals        enable row level security;
alter table session_events        enable row level security;
alter table debriefs              enable row level security;
alter table debrief_findings      enable row level security;
alter table lesson_deliveries     enable row level security;

create policy "dono le seu perfil" on profiles
  for select using (auth.uid() = id);
create policy "dono edita seu perfil" on profiles
  for update using (auth.uid() = id);
create policy "dono le sua assinatura" on subscriptions
  for select using (auth.uid() = user_id);
create policy "dono le sua cota" on usage_counters
  for select using (auth.uid() = user_id);
create policy "dono le suas sessoes" on sessions
  for select using (auth.uid() = user_id);

-- Modelo para as tabelas filhas de sessions (repetir para cada uma):
create policy "dono le mensagens" on session_messages
  for select using (exists (
    select 1 from sessions s
     where s.id = session_messages.session_id and s.user_id = auth.uid()
  ));

-- Catálogos e casos publicados: leitura para qualquer usuário autenticado.
alter table cases enable row level security;
create policy "casos publicados sao visiveis" on cases
  for select to authenticated using (publicado = true);

-- IMPORTANTE: case_lab_results, case_imaging_results, case_treatments,
-- case_exam_findings e case_personas ficam com RLS ligado e SEM policy de
-- select. RLS ativo + zero policy = ninguém lê pelo client. Só as Edge
-- Functions (service_role) enxergam o gabarito.
alter table case_lab_results     enable row level security;
alter table case_imaging_results enable row level security;
alter table case_treatments      enable row level security;
alter table case_exam_findings   enable row level security;
alter table case_personas        enable row level security;

-- ------------------------------ 7. RPCs ------------------------------
-- Cota do freemium aplicada no servidor, nunca no client.
create or replace function start_session(p_case_id uuid)
returns uuid
language plpgsql security definer set search_path = public as $fn$
declare
  v_tier   plan_tier;
  v_usadas int;
  v_free   boolean;
  v_id     uuid;
begin
  select coalesce(tier,'free') into v_tier
    from subscriptions where user_id = auth.uid();

  select coalesce(sessoes_iniciadas,0) into v_usadas
    from usage_counters
   where user_id = auth.uid()
     and competencia = date_trunc('month', now())::date;

  select is_free into v_free
    from cases where id = p_case_id and publicado;

  if coalesce(v_tier,'free') = 'free' then
    if not coalesce(v_free,false) then
      raise exception 'CASO_PREMIUM' using hint = 'Assine para abrir casos complexos';
    end if;
    if coalesce(v_usadas,0) >= 2 then
      raise exception 'COTA_ESGOTADA' using hint = 'Limite de 2 casos no mes';
    end if;
  end if;

  insert into sessions (user_id, case_id, tier_no_inicio)
       values (auth.uid(), p_case_id, coalesce(v_tier,'free'))
    returning id into v_id;

  insert into usage_counters (user_id, competencia, sessoes_iniciadas)
       values (auth.uid(), date_trunc('month', now())::date, 1)
  on conflict (user_id, competencia)
    do update set sessoes_iniciadas = usage_counters.sessoes_iniciadas + 1;

  return v_id;
end $fn$;

-- =====================================================================
-- 8. FARMACODINÂMICA
-- O fármaco se comporta igual em qualquer caso: início, pico, duração e
-- deslocamento de cada parâmetro no pico, para a dose de referência.
-- O que muda de caso para caso é a CLASSIFICAÇÃO (em case_treatments) e a
-- INTERAÇÃO (em case_interactions).
-- =====================================================================
alter table medications
  add column pd_inicio_min  numeric not null default 5,
  add column pd_pico_min    numeric not null default 20,
  add column pd_duracao_min numeric not null default 120,
  add column pd_efeito      jsonb   not null default '{}',  -- {"pas":-19,"fc":8}
  add column doses          jsonb   not null default '[]',  -- [{"rotulo":"5 mg","fator":1}]
  add column nota_ensino    text;

create table case_interactions (
  case_id       uuid not null references cases(id) on delete cascade,
  medication_id uuid not null references medications(id),
  fator         numeric not null,      -- >1 amplifica, <1 reduz
  motivo        text not null,         -- aparece no painel "em ação" e no debrief
  primary key (case_id, medication_id)
);
alter table case_interactions enable row level security;  -- sem policy: só service_role

-- Cada administração guarda a dose e o instante; o estado fisiológico é
-- recalculado como função pura do tempo, então a sessão é reproduzível.
alter table session_prescriptions
  add column dose_rotulo text,
  add column dose_fator  numeric not null default 1;

-- =====================================================================
-- 9. CURSOS, TURMAS E PROGRESSO
-- É a camada que um professor compra: ele monta a sequência, distribui o
-- código da turma e enxerga onde o grupo tropeçou.
-- =====================================================================
create table cursos (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references profiles(id) on delete cascade,
  titulo      text not null,
  subtitulo   text,
  instituicao text,
  publico     text,
  descricao   text,
  publicado   boolean not null default false,
  criado_em   timestamptz not null default now()
);

create table aulas (
  id               uuid primary key default gen_random_uuid(),
  curso_id         uuid not null references cursos(id) on delete cascade,
  ordem            int not null,
  titulo           text not null,
  objetivo         text not null,          -- objetivo de aprendizagem declarado
  case_id          uuid references cases(id),
  nota_do_preceptor text,                  -- roteiro de discussão, só o professor lê
  unique (curso_id, ordem)
);

create table turmas (
  id         uuid primary key default gen_random_uuid(),
  curso_id   uuid not null references cursos(id) on delete cascade,
  nome       text not null,
  codigo     text unique not null,          -- 'PP-7QK2', o que vai para o aluno
  abre_em    timestamptz,
  fecha_em   timestamptz,
  criada_em  timestamptz not null default now()
);

create table matriculas (
  turma_id     uuid not null references turmas(id) on delete cascade,
  user_id      uuid not null references profiles(id) on delete cascade,
  papel        text not null default 'aluno',   -- aluno | monitor | professor
  matriculado_em timestamptz not null default now(),
  primary key (turma_id, user_id)
);

create table progresso_aula (
  id         uuid primary key default gen_random_uuid(),
  turma_id   uuid not null references turmas(id) on delete cascade,
  aula_id    uuid not null references aulas(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  total      int, anamnese int, investigacao int, conduta int, soft_skills int,
  custo_cents int,
  duracao_min int,
  concluida_em timestamptz not null default now()
);
create index on progresso_aula (turma_id, aula_id);

alter table cursos         enable row level security;
alter table aulas          enable row level security;
alter table turmas         enable row level security;
alter table matriculas     enable row level security;
alter table progresso_aula enable row level security;

-- O dono edita o curso; quem está matriculado numa turma dele, lê.
create policy "dono edita seu curso" on cursos
  for all using (auth.uid() = owner_id);

create policy "matriculado le o curso" on cursos
  for select using (exists (
    select 1 from turmas t
      join matriculas m on m.turma_id = t.id
     where t.curso_id = cursos.id and m.user_id = auth.uid()
  ));

-- nota_do_preceptor NÃO deve ir para o aluno: exponha aulas ao aluno por uma
-- view (aulas_do_aluno) sem essa coluna, e mantenha a policy de select da
-- tabela restrita ao dono. RLS filtra linha, não coluna.
create policy "dono le suas aulas" on aulas
  for all using (exists (
    select 1 from cursos c where c.id = aulas.curso_id and c.owner_id = auth.uid()
  ));

create policy "aluno le seu progresso" on progresso_aula
  for select using (auth.uid() = user_id);

create policy "professor le o progresso da turma" on progresso_aula
  for select using (exists (
    select 1 from turmas t
      join cursos c on c.id = t.curso_id
     where t.id = progresso_aula.turma_id and c.owner_id = auth.uid()
  ));

-- Entrar na turma pelo código, sem o aluno precisar enxergar a tabela.
create or replace function entrar_na_turma(p_codigo text)
returns uuid
language plpgsql security definer set search_path = public as $fn$
declare v_turma uuid;
begin
  select id into v_turma from turmas
   where upper(codigo) = upper(p_codigo)
     and (abre_em is null or now() >= abre_em)
     and (fecha_em is null or now() <= fecha_em);

  if v_turma is null then
    raise exception 'TURMA_INVALIDA' using hint = 'Confira o código com quem dá a aula';
  end if;

  insert into matriculas (turma_id, user_id) values (v_turma, auth.uid())
  on conflict do nothing;

  return v_turma;
end $fn$;
