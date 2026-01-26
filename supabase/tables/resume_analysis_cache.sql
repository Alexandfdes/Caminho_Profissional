-- Run this file in Supabase SQL editor to create cache table for CV analyses
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
