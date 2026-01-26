-- 1. Habilita extensões necessárias para gerar UUIDs
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- 2. Garante que a tabela existe com a estrutura correta
create table if not exists public.resume_analysis_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  text_hash text not null,
  metadata_hash text not null,
  cache_key text not null unique,
  metadata jsonb,
  analysis_result jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Habilita segurança a nível de linha (RLS)
alter table public.resume_analysis_cache enable row level security;

-- 4. Remove políticas antigas para evitar conflitos
drop policy if exists "users can insert cached analyses" on public.resume_analysis_cache;
drop policy if exists "users can select their cached analyses" on public.resume_analysis_cache;
drop policy if exists "users can update their cached analyses" on public.resume_analysis_cache;
drop policy if exists "users can delete their cached analyses" on public.resume_analysis_cache;

-- 5. Cria novas políticas permitindo que o usuário gerencie SEU próprio cache
create policy "users can insert cached analyses"
  on public.resume_analysis_cache
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can select their cached analyses"
  on public.resume_analysis_cache
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users can update their cached analyses"
  on public.resume_analysis_cache
  for update
  to authenticated
  using (auth.uid() = user_id);

create policy "users can delete their cached analyses"
  on public.resume_analysis_cache
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- 6. Garante permissões de acesso à tabela
grant all on public.resume_analysis_cache to authenticated;
grant all on public.resume_analysis_cache to service_role;
