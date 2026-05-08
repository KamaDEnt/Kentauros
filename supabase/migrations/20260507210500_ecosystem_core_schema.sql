create table if not exists public.tenants (
  id text primary key,
  name text not null,
  status text not null default 'active',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  id integer primary key,
  tenant_id text not null,
  email text not null unique,
  name text not null,
  role text not null,
  tags text[] not null default '{}',
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role text not null,
  module text not null,
  can_access boolean not null default false,
  policy jsonb not null default '{}'::jsonb,
  primary key (role, module)
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  client_id text,
  lead_id text,
  project_id text,
  owner_user_id integer,
  title text not null,
  status text not null default 'scheduled',
  meeting_at timestamptz,
  recording_urls text[] not null default '{}',
  transcript text,
  summary text,
  decisions jsonb not null default '[]'::jsonb,
  requirements jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  entity_type text not null,
  entity_id text not null,
  requested_by integer,
  approver_user_id integer,
  approver_role text,
  status text not null default 'pending',
  decision_notes text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists public.learning_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  user_id integer,
  client_id text,
  lead_id text,
  project_id text,
  source text not null,
  event_type text not null,
  title text not null,
  content text,
  signal_strength integer not null default 1,
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  project_id text,
  task_id text,
  requested_by integer,
  agent text not null,
  mode text not null default 'manual',
  status text not null default 'pending',
  input_context jsonb not null default '{}'::jsonb,
  output_artifacts jsonb not null default '{}'::jsonb,
  approval_status text not null default 'pending',
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists user_profiles_tenant_idx on public.user_profiles (tenant_id);
create index if not exists meetings_tenant_status_idx on public.meetings (tenant_id, status);
create index if not exists approvals_tenant_entity_idx on public.approval_requests (tenant_id, entity_type, entity_id);
create index if not exists learning_events_tenant_project_idx on public.learning_events (tenant_id, project_id);
create index if not exists workflow_runs_tenant_status_idx on public.workflow_runs (tenant_id, status);

alter table public.tenants enable row level security;
alter table public.user_profiles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.meetings enable row level security;
alter table public.approval_requests enable row level security;
alter table public.learning_events enable row level security;
alter table public.workflow_runs enable row level security;

create policy "Allow app anon tenant reads" on public.tenants for select using (true);
create policy "Allow app anon tenant writes" on public.tenants for insert with check (true);
create policy "Allow app anon tenant updates" on public.tenants for update using (true) with check (true);

create policy "Allow app anon profile reads" on public.user_profiles for select using (true);
create policy "Allow app anon profile writes" on public.user_profiles for insert with check (true);
create policy "Allow app anon profile updates" on public.user_profiles for update using (true) with check (true);

create policy "Allow app anon permission reads" on public.role_permissions for select using (true);
create policy "Allow app anon permission writes" on public.role_permissions for insert with check (true);
create policy "Allow app anon permission updates" on public.role_permissions for update using (true) with check (true);

create policy "Allow app anon meeting reads" on public.meetings for select using (true);
create policy "Allow app anon meeting writes" on public.meetings for insert with check (true);
create policy "Allow app anon meeting updates" on public.meetings for update using (true) with check (true);

create policy "Allow app anon approval reads" on public.approval_requests for select using (true);
create policy "Allow app anon approval writes" on public.approval_requests for insert with check (true);
create policy "Allow app anon approval updates" on public.approval_requests for update using (true) with check (true);

create policy "Allow app anon learning reads" on public.learning_events for select using (true);
create policy "Allow app anon learning writes" on public.learning_events for insert with check (true);
create policy "Allow app anon learning updates" on public.learning_events for update using (true) with check (true);

create policy "Allow app anon workflow reads" on public.workflow_runs for select using (true);
create policy "Allow app anon workflow writes" on public.workflow_runs for insert with check (true);
create policy "Allow app anon workflow updates" on public.workflow_runs for update using (true) with check (true);
