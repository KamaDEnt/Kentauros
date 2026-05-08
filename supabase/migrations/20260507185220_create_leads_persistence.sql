create table if not exists public.leads (
  id uuid primary key,
  tenant_id text not null,
  user_id integer not null,
  company text not null,
  contact text,
  email text,
  phone text,
  source text,
  status text not null default 'new',
  score integer not null default 0,
  stage text,
  value numeric not null default 0,
  industry text,
  notes text,
  assigned_to integer,
  created_at timestamptz not null default now(),
  last_activity timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists leads_tenant_user_idx on public.leads (tenant_id, user_id);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_source_idx on public.leads (source);

alter table public.leads enable row level security;

create policy "Allow app anon lead reads"
  on public.leads
  for select
  using (true);

create policy "Allow app anon lead writes"
  on public.leads
  for insert
  with check (true);

create policy "Allow app anon lead updates"
  on public.leads
  for update
  using (true)
  with check (true);
