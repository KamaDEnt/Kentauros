create unique index if not exists leads_unique_capture_identity_per_tenant
  on public.leads (tenant_id, (metadata->>'captureIdentity'))
  where metadata ? 'captureIdentity'
    and coalesce(metadata->>'captureIdentity', '') <> '';
