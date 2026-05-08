insert into public.tenants (id, name, status)
values ('tenant-a', 'Kentauros Principal', 'active'), ('tenant-b', 'Kentauros Operacao B', 'active')
on conflict (id) do nothing;

insert into public.role_permissions (role, module, can_access) values
  ('admin', 'dashboard', true), ('admin', 'leads', true), ('admin', 'discovery', true), ('admin', 'proposals', true), ('admin', 'projects', true), ('admin', 'kanban', true), ('admin', 'backlog', true), ('admin', 'ux', true), ('admin', 'prototypes', true), ('admin', 'dev', true), ('admin', 'opencode', true), ('admin', 'qa', true), ('admin', 'deploy', true), ('admin', 'support', true), ('admin', 'clients', true), ('admin', 'users', true), ('admin', 'automations', true), ('admin', 'settings', true), ('admin', 'productivity', true), ('admin', 'logs', true), ('admin', 'audit', true),
  ('comercial', 'dashboard', true), ('comercial', 'leads', true), ('comercial', 'proposals', true), ('comercial', 'clients', true), ('comercial', 'settings', false),
  ('prevendas', 'dashboard', true), ('prevendas', 'leads', true), ('prevendas', 'proposals', true), ('prevendas', 'clients', true),
  ('dev', 'dashboard', true), ('dev', 'projects', true), ('dev', 'kanban', true), ('dev', 'backlog', true), ('dev', 'ux', true), ('dev', 'prototypes', true), ('dev', 'dev', true), ('dev', 'opencode', true), ('dev', 'qa', true), ('dev', 'deploy', true),
  ('ux', 'dashboard', true), ('ux', 'projects', true), ('ux', 'ux', true), ('ux', 'prototypes', true),
  ('qa', 'dashboard', true), ('qa', 'projects', true), ('qa', 'qa', true), ('qa', 'opencode', true),
  ('devops', 'dashboard', true), ('devops', 'projects', true), ('devops', 'deploy', true), ('devops', 'automations', true),
  ('suporte', 'dashboard', true), ('suporte', 'support', true), ('suporte', 'clients', true),
  ('cliente', 'dashboard', true), ('cliente', 'projects', true), ('cliente', 'support', true)
on conflict (role, module) do update set can_access = excluded.can_access;
