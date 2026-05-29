-- =============================================
-- SOCIALIS — Schema completo v1
-- Execute no Supabase: SQL Editor → New Query
-- =============================================

-- Extensões necessárias
create extension if not exists "uuid-ossp";

-- =============================================
-- TABELA: programs (clientes/white-label)
-- =============================================
create table public.programs (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  slug            text not null unique,
  logo_url        text,
  primary_color   text not null default '#C026D3',
  dark_color      text not null default '#3B0764',
  task_label      text not null default 'Desafios',
  points_label    text not null default 'Pontos',
  participant_label text not null default 'Creators',
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- =============================================
-- TABELA: profiles (usuários)
-- =============================================
create type public.user_role as enum ('participante', 'curador', 'admin', 'super_admin');

create table public.profiles (
  id              uuid primary key references auth.users on delete cascade,
  program_id      uuid not null references public.programs on delete cascade,
  email           text not null,
  name            text not null,
  role            public.user_role not null default 'participante',
  instagram       text,
  whatsapp        text,
  linkedin        text,
  avatar_url      text,
  points          integer not null default 0,
  ranking_position integer,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- =============================================
-- TABELA: tasks (tarefas/desafios)
-- =============================================
create type public.task_frequency as enum ('unica', 'semanal', 'mensal');

create table public.tasks (
  id              uuid primary key default uuid_generate_v4(),
  program_id      uuid not null references public.programs on delete cascade,
  title           text not null,
  description     text not null,
  instructions    text[] not null default '{}',
  network         text not null default 'Instagram',
  content_type    text not null default 'Post',
  proof_type      text not null default 'print',
  points          integer not null default 100,
  frequency       public.task_frequency not null default 'semanal',
  active          boolean not null default true,
  expires_at      timestamptz,
  created_at      timestamptz not null default now()
);

-- =============================================
-- TABELA: submissions (comprovantes)
-- =============================================
create type public.submission_status as enum ('pendente', 'aprovado', 'recusado');

create table public.submissions (
  id              uuid primary key default uuid_generate_v4(),
  task_id         uuid not null references public.tasks on delete cascade,
  user_id         uuid not null references public.profiles on delete cascade,
  program_id      uuid not null references public.programs on delete cascade,
  proof_url       text,
  proof_note      text,
  status          public.submission_status not null default 'pendente',
  points_awarded  integer,
  reviewed_by     uuid references public.profiles,
  reviewed_at     timestamptz,
  review_note     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- =============================================
-- TABELA: notifications
-- =============================================
create table public.notifications (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles on delete cascade,
  program_id      uuid not null references public.programs on delete cascade,
  title           text not null,
  body            text not null,
  type            text not null default 'info',
  read            boolean not null default false,
  created_at      timestamptz not null default now()
);

-- =============================================
-- VIEW: ranking (calculado em tempo real)
-- =============================================
create or replace view public.ranking as
select
  p.id as user_id,
  p.program_id,
  p.name,
  p.avatar_url,
  p.points,
  row_number() over (
    partition by p.program_id
    order by p.points desc, p.created_at asc
  )::integer as position,
  count(s.id)::integer as submissions_count,
  case
    when count(s.id) = 0 then 0
    else round(
      count(case when s.status = 'aprovado' then 1 end)::numeric
      / count(s.id)::numeric * 100
    )::integer
  end as approval_rate
from public.profiles p
left join public.submissions s on s.user_id = p.id and s.program_id = p.program_id
where p.role = 'participante' and p.active = true
group by p.id, p.program_id, p.name, p.avatar_url, p.points, p.created_at;

-- =============================================
-- FUNÇÃO: award_points (creditar pontos atomicamente)
-- =============================================
create or replace function public.award_points(
  p_user_id uuid,
  p_points integer,
  p_program_id uuid
) returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set
    points = points + p_points,
    updated_at = now()
  where id = p_user_id and program_id = p_program_id;
end;
$$;

-- =============================================
-- FUNÇÃO: approve_submission (aprovar + creditar)
-- =============================================
create or replace function public.approve_submission(
  p_submission_id uuid,
  p_reviewer_id uuid,
  p_points integer,
  p_note text default null
) returns void
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_program_id uuid;
begin
  -- Atualizar submission
  update public.submissions
  set
    status = 'aprovado',
    points_awarded = p_points,
    reviewed_by = p_reviewer_id,
    reviewed_at = now(),
    review_note = p_note,
    updated_at = now()
  where id = p_submission_id
  returning user_id, program_id into v_user_id, v_program_id;

  -- Creditar pontos
  perform public.award_points(v_user_id, p_points, v_program_id);

  -- Criar notificação
  insert into public.notifications (user_id, program_id, title, body, type)
  select
    v_user_id,
    v_program_id,
    '✅ Comprovante aprovado!',
    'Você ganhou ' || p_points || ' pontos.',
    'aprovacao';
end;
$$;

-- =============================================
-- FUNÇÃO: reject_submission
-- =============================================
create or replace function public.reject_submission(
  p_submission_id uuid,
  p_reviewer_id uuid,
  p_note text
) returns void
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_program_id uuid;
begin
  update public.submissions
  set
    status = 'recusado',
    reviewed_by = p_reviewer_id,
    reviewed_at = now(),
    review_note = p_note,
    updated_at = now()
  where id = p_submission_id
  returning user_id, program_id into v_user_id, v_program_id;

  insert into public.notifications (user_id, program_id, title, body, type)
  values (
    v_user_id,
    v_program_id,
    '❌ Comprovante recusado',
    coalesce(p_note, 'Seu comprovante foi recusado. Verifique as instruções e reenvie.'),
    'recusado'
  );
end;
$$;

-- =============================================
-- TRIGGER: updated_at automático
-- =============================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger submissions_updated_at
  before update on public.submissions
  for each row execute function public.handle_updated_at();

-- =============================================
-- TRIGGER: criar profile quando user é criado no auth
-- =============================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  -- Profile é criado via API no onboarding, não aqui
  -- Esse trigger apenas garante que o user existe
  return new;
end;
$$;

-- =============================================
-- STORAGE: bucket para comprovantes
-- =============================================
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', false)
on conflict (id) do nothing;

-- =============================================
-- RLS (Row Level Security)
-- =============================================
alter table public.programs enable row level security;
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.submissions enable row level security;
alter table public.notifications enable row level security;

-- Programs: todos podem ver o programa do próprio tenant
create policy "programs_select" on public.programs
  for select using (true);

-- Profiles: usuário vê apenas perfis do mesmo programa
create policy "profiles_select" on public.profiles
  for select using (
    program_id in (
      select program_id from public.profiles where id = auth.uid()
    )
  );

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- Tasks: participantes veem tarefas do seu programa
create policy "tasks_select" on public.tasks
  for select using (
    program_id in (
      select program_id from public.profiles where id = auth.uid()
    )
  );

create policy "tasks_admin" on public.tasks
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'curador', 'super_admin')
      and program_id = tasks.program_id
    )
  );

-- Submissions: participante vê as próprias, admin vê todas do programa
create policy "submissions_select_own" on public.submissions
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'curador', 'super_admin')
      and program_id = submissions.program_id
    )
  );

create policy "submissions_insert" on public.submissions
  for insert with check (user_id = auth.uid());

create policy "submissions_update_admin" on public.submissions
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'curador', 'super_admin')
      and program_id = submissions.program_id
    )
  );

-- Notifications: usuário vê apenas as próprias
create policy "notifications_select" on public.notifications
  for select using (user_id = auth.uid());

create policy "notifications_update" on public.notifications
  for update using (user_id = auth.uid());

-- Storage: upload de comprovantes
create policy "proofs_insert" on storage.objects
  for insert with check (
    bucket_id = 'proofs'
    and auth.uid() is not null
  );

create policy "proofs_select_admin" on storage.objects
  for select using (
    bucket_id = 'proofs'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or exists (
        select 1 from public.profiles
        where id = auth.uid()
        and role in ('admin', 'curador', 'super_admin')
      )
    )
  );

-- =============================================
-- DADOS INICIAIS: programa Triumph (demo)
-- =============================================
insert into public.programs (name, slug, primary_color, dark_color, task_label, points_label, participant_label)
values (
  'Engaja Triumph',
  'triumph',
  '#C026D3',
  '#3B0764',
  'Desafios',
  'Pontos',
  'Creators'
);

-- Tarefas de exemplo (usar o ID do programa inserido)
insert into public.tasks (program_id, title, description, instructions, network, content_type, proof_type, points, frequency)
select
  p.id,
  'Criar Reels mostrando produto em uso',
  'Grave e publique um Reels autêntico mostrando o produto. Mínimo 15s, mencione a marca na legenda com hashtag oficial.',
  ARRAY[
    'Grave o Reels mostrando o produto em uso real',
    'Edite com legenda + hashtag oficial da marca',
    'Publique e aguarde 2 horas para indexar',
    'Tire print com curtidas/views visíveis',
    'Envie aqui — validação em até 48h'
  ],
  'Instagram', 'Reels', 'print', 500, 'semanal'
from public.programs p where p.slug = 'triumph';

insert into public.tasks (program_id, title, description, instructions, network, content_type, proof_type, points, frequency)
select
  p.id,
  'Story com link de contato',
  'Publique story com CTA claro e link direto para WhatsApp ou DM.',
  ARRAY[
    'Crie o story com sticker de link ou CTA visível',
    'Publique e aguarde ficar ativo',
    'Tire print do story com link/CTA',
    'Envie o print como comprovante'
  ],
  'Instagram', 'Story', 'print', 300, 'semanal'
from public.programs p where p.slug = 'triumph';

insert into public.tasks (program_id, title, description, instructions, network, content_type, proof_type, points, frequency)
select
  p.id,
  'Postar autoridade no LinkedIn',
  'Publique conteúdo profissional — insight de mercado, caso de cliente ou tendência.',
  ARRAY[
    'Escreva e publique o post (mínimo 3 parágrafos)',
    'Mencione a marca ou produto',
    'Tire print do post publicado',
    'Envie como comprovante'
  ],
  'LinkedIn', 'Post', 'print', 250, 'semanal'
from public.programs p where p.slug = 'triumph';

insert into public.tasks (program_id, title, description, instructions, network, content_type, proof_type, points, frequency)
select
  p.id,
  'Enviar catálogo para lead via WhatsApp',
  'Envie o catálogo oficial para um cliente ou lead com mensagem personalizada.',
  ARRAY[
    'Baixe o catálogo em Conhecimento > Materiais',
    'Envie com mensagem personalizada',
    'Tire print da conversa (pode ocultar o nome)',
    'Envie aqui como comprovante'
  ],
  'WhatsApp', 'Mensagem', 'print', 150, 'semanal'
from public.programs p where p.slug = 'triumph';

insert into public.tasks (program_id, title, description, instructions, network, content_type, proof_type, points, frequency)
select
  p.id,
  'Live de apresentação do produto',
  'Faça uma live no Instagram apresentando um produto. Mínimo 15 minutos.',
  ARRAY[
    'Planeje: produto, roteiro e horário',
    'Avise a audiência 24h antes',
    'Realize a live (mínimo 15 min)',
    'Tire print do encerramento com visualizações',
    'Envie como comprovante'
  ],
  'Instagram', 'Live', 'print', 1000, 'unica'
from public.programs p where p.slug = 'triumph';
