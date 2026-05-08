create table if not exists public.operational_records (
  row_key text primary key,
  tenant_id text not null,
  entity_type text not null,
  entity_id text not null,
  user_id integer,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists operational_records_tenant_type_idx
  on public.operational_records (tenant_id, entity_type);

create index if not exists operational_records_entity_idx
  on public.operational_records (entity_type, entity_id);

alter table public.operational_records enable row level security;

create policy "Allow app anon operational reads"
  on public.operational_records
  for select
  using (true);

create policy "Allow app anon operational writes"
  on public.operational_records
  for insert
  with check (true);

create policy "Allow app anon operational updates"
  on public.operational_records
  for update
  using (true)
  with check (true);
