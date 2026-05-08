insert into public.user_profiles (id, tenant_id, email, name, role, tags, status, metadata)
values
  (1, 'tenant-a', 'admin@kentauros.com', 'Admin Master', 'admin', array['ADMIN','DEV','QA','UX'], 'active', '{"department":"TI","avatar":"AM"}'::jsonb),
  (13, 'tenant-a', 'admin@kentauros.consulting', 'Admin Kentauros', 'admin', array['ADMIN','DEV','QA','UX','DEVOPS'], 'active', '{"department":"Administração","avatar":"AK"}'::jsonb),
  (14, 'tenant-a', 'operacional@kentauros.consulting', 'Admin Operacional', 'admin', array['ADMIN','COMERCIAL','DEV','QA','UX'], 'active', '{"department":"Operações","avatar":"AO"}'::jsonb)
on conflict (id) do update set
  tenant_id = excluded.tenant_id,
  email = excluded.email,
  name = excluded.name,
  role = excluded.role,
  tags = excluded.tags,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = now();
