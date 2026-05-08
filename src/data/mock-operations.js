export const mockBacklog = [
  // Projeto 1 — Portal TechCorp
  { id: 1, tenant_id: 'tenant-a', projectId: 1, title: 'Autenticação SSO com Azure AD', type: 'feature', priority: 'high', status: 'done', points: 8, assignee: 8, sprint: 'Sprint 12', tags: ['auth', 'azure'] },
  { id: 2, tenant_id: 'tenant-b', projectId: 1, title: 'Dashboard de colaboradores', type: 'feature', priority: 'high', status: 'in_progress', points: 13, assignee: 8, sprint: 'Sprint 12', tags: ['dashboard', 'react'] },
  { id: 3, tenant_id: 'tenant-a', projectId: 1, title: 'Módulo de férias e ausências', type: 'feature', priority: 'medium', status: 'review', points: 8, assignee: 8, sprint: 'Sprint 12', tags: ['rh'] },
  { id: 4, tenant_id: 'tenant-b', projectId: 1, title: 'Bug: calendário não salva timezone', type: 'bug', priority: 'critical', status: 'in_progress', points: 3, assignee: 8, sprint: 'Sprint 12', tags: ['bug', 'calendar'] },
  { id: 5, tenant_id: 'tenant-a', projectId: 1, title: 'Integração com SAP RH', type: 'feature', priority: 'high', status: 'todo', points: 21, assignee: 8, sprint: 'Sprint 13', tags: ['integration', 'sap'] },
  { id: 6, tenant_id: 'tenant-b', projectId: 1, title: 'Relatório mensal de horas', type: 'feature', priority: 'medium', status: 'todo', points: 5, assignee: 8, sprint: 'Sprint 13', tags: ['report'] },
  { id: 7, tenant_id: 'tenant-a', projectId: 1, title: 'Testes E2E dashboard', type: 'task', priority: 'medium', status: 'todo', points: 5, assignee: 9, sprint: 'Sprint 12', tags: ['qa', 'e2e'] },
  { id: 8, tenant_id: 'tenant-b', projectId: 1, title: 'Otimização de queries lentas', type: 'task', priority: 'high', status: 'blocked', points: 8, assignee: 8, sprint: 'Sprint 12', tags: ['performance', 'db'] },

  // Projeto 3 — E-commerce
  { id: 9, tenant_id: 'tenant-a', projectId: 3, title: 'Checkout integrado Shopify', type: 'feature', priority: 'critical', status: 'in_progress', points: 13, assignee: 8, sprint: 'Sprint 8', tags: ['shopify', 'checkout'] },
  { id: 10, tenant_id: 'tenant-b', projectId: 3, title: 'Painel admin de produtos', type: 'feature', priority: 'high', status: 'review', points: 8, assignee: 8, sprint: 'Sprint 8', tags: ['admin'] },
  { id: 11, tenant_id: 'tenant-a', projectId: 3, title: 'Bug: preço incorreto no carrinho', type: 'bug', priority: 'critical', status: 'todo', points: 2, assignee: 8, sprint: 'Sprint 8', tags: ['bug', 'cart'] },
  { id: 12, tenant_id: 'tenant-b', projectId: 3, title: 'SEO otimização páginas de produto', type: 'task', priority: 'medium', status: 'todo', points: 5, assignee: 8, sprint: 'Sprint 9', tags: ['seo'] },

  // Projeto 4 — FinanSafe
  { id: 13, tenant_id: 'tenant-a', projectId: 4, title: 'Módulo PIX — Recebimento', type: 'feature', priority: 'critical', status: 'done', points: 21, assignee: 8, sprint: 'Sprint 20', tags: ['pix', 'payments'] },
  { id: 14, tenant_id: 'tenant-b', projectId: 4, title: 'Relatório BACEN mensal', type: 'feature', priority: 'high', status: 'done', points: 13, assignee: 8, sprint: 'Sprint 20', tags: ['bacen', 'compliance'] },
  { id: 15, tenant_id: 'tenant-a', projectId: 4, title: 'Validação final — homologação Banco Central', type: 'task', priority: 'critical', status: 'review', points: 8, assignee: 9, sprint: 'Sprint 20', tags: ['compliance', 'qa'] },

  // Projeto 6 — SaúdePrime
  { id: 16, tenant_id: 'tenant-b', projectId: 6, title: 'Agendamento online', type: 'feature', priority: 'high', status: 'in_progress', points: 13, assignee: 8, sprint: 'Sprint 4', tags: ['scheduling'] },
  { id: 17, tenant_id: 'tenant-a', projectId: 6, title: 'Prontuário eletrônico básico', type: 'feature', priority: 'high', status: 'todo', points: 21, assignee: 8, sprint: 'Sprint 5', tags: ['medical'] },
  { id: 18, tenant_id: 'tenant-b', projectId: 6, title: 'Integração com Tasy', type: 'feature', priority: 'medium', status: 'todo', points: 13, assignee: 8, sprint: 'Sprint 6', tags: ['integration'] },

  // Projeto 7 — EduFutura
  { id: 19, tenant_id: 'tenant-a', projectId: 7, title: 'Player de vídeo-aulas', type: 'feature', priority: 'high', status: 'done', points: 8, assignee: 8, sprint: 'Sprint 9', tags: ['video', 'lms'] },
  { id: 20, tenant_id: 'tenant-b', projectId: 7, title: 'Sistema de gamificação — XP e badges', type: 'feature', priority: 'medium', status: 'in_progress', points: 13, assignee: 8, sprint: 'Sprint 9', tags: ['gamification'] },
  { id: 21, tenant_id: 'tenant-a', projectId: 7, title: 'Relatório de progresso do aluno', type: 'feature', priority: 'medium', status: 'todo', points: 8, assignee: 8, sprint: 'Sprint 10', tags: ['report'] },
  { id: 22, tenant_id: 'tenant-b', projectId: 7, title: 'Bug: vídeo trava em mobile', type: 'bug', priority: 'high', status: 'todo', points: 3, assignee: 8, sprint: 'Sprint 9', tags: ['bug', 'mobile'] },
];

export const BACKLOG_COLUMNS = [
  { id: 'todo', label: 'A fazer', color: '#4a5568' },
  { id: 'in_progress', label: 'Em andamento', color: '#00d4ff' },
  { id: 'review', label: 'Em revisão', color: '#ffd166' },
  { id: 'done', label: 'Concluído', color: '#00e5a0' },
  { id: 'blocked', label: 'Bloqueado', color: '#ff4d6d' },
];

export const mockQATests = [
  { id: 1, tenant_id: 'tenant-a', projectId: 1, title: 'Login SSO fluxo completo', type: 'functional', status: 'passed', priority: 'critical', assignee: 9, environment: 'staging', executedAt: '2024-11-18', duration: '2m 30s' },
  { id: 2, tenant_id: 'tenant-b', projectId: 1, title: 'Dashboard carregamento inicial', type: 'performance', status: 'passed', priority: 'high', assignee: 9, environment: 'staging', executedAt: '2024-11-18', duration: '45s' },
  { id: 3, tenant_id: 'tenant-a', projectId: 1, title: 'Exportação de relatório PDF', type: 'functional', status: 'failed', priority: 'high', assignee: 9, environment: 'staging', executedAt: '2024-11-19', duration: '1m 15s' },
  { id: 4, tenant_id: 'tenant-b', projectId: 4, title: 'Fluxo PIX — Envio ponta a ponta', type: 'functional', status: 'passed', priority: 'critical', assignee: 9, environment: 'homolog', executedAt: '2024-11-19', duration: '5m 10s' },
  { id: 5, tenant_id: 'tenant-a', projectId: 4, title: 'Concorrência — 1000 transações simultâneas', type: 'performance', status: 'passed', priority: 'critical', assignee: 9, environment: 'homolog', executedAt: '2024-11-20', duration: '12m' },
  { id: 6, tenant_id: 'tenant-b', projectId: 3, title: 'Checkout fluxo completo', type: 'functional', status: 'pending', priority: 'critical', assignee: 9, environment: 'staging', executedAt: null, duration: null },
  { id: 7, tenant_id: 'tenant-a', projectId: 7, title: 'Player de vídeo — compatibilidade mobile', type: 'compatibility', status: 'failed', priority: 'high', assignee: 9, environment: 'staging', executedAt: '2024-11-20', duration: '3m' },
];

export const mockDeployments = [
  { id: 1, tenant_id: 'tenant-a', projectId: 4, env: 'production', version: 'v2.8.0', status: 'success', deployedBy: 10, deployedAt: '2024-11-19T14:30:00', duration: '8m 22s', notes: 'Módulo PIX em produção' },
  { id: 2, tenant_id: 'tenant-b', projectId: 1, env: 'staging', version: 'v1.12.0', status: 'success', deployedBy: 10, deployedAt: '2024-11-20T10:15:00', duration: '5m 10s', notes: 'Deploy de homologação Sprint 12' },
  { id: 3, tenant_id: 'tenant-a', projectId: 3, env: 'staging', version: 'v0.8.1', status: 'failed', deployedBy: 10, deployedAt: '2024-11-20T16:45:00', duration: '2m 30s', notes: 'Falha na build — dependência incompatível' },
  { id: 4, tenant_id: 'tenant-b', projectId: 7, env: 'production', version: 'v1.5.0', status: 'success', deployedBy: 10, deployedAt: '2024-11-18T09:00:00', duration: '6m 45s', notes: 'Release player de vídeo' },
];

export const mockTickets = [
  { id: 1, tenant_id: 'tenant-a', projectId: 1, title: 'Login SSO não funciona no IE11', category: 'bug', priority: 'high', status: 'open', sla: '4h', slaRemaining: '1h 30m', assignee: 11, reporter: 12, createdAt: '2024-11-20T08:00:00', updatedAt: '2024-11-20T10:30:00' },
  { id: 2, tenant_id: 'tenant-b', projectId: 3, title: 'Produto não aparece após cadastro', category: 'bug', priority: 'critical', status: 'in_progress', sla: '2h', slaRemaining: '0h 20m', assignee: 11, reporter: 12, createdAt: '2024-11-20T11:00:00', updatedAt: '2024-11-20T12:00:00' },
  { id: 3, tenant_id: 'tenant-a', projectId: 4, title: 'Dúvida sobre extrato PIX', category: 'question', priority: 'medium', status: 'resolved', sla: '8h', slaRemaining: '8h 00m', assignee: 11, reporter: 12, createdAt: '2024-11-19T14:00:00', updatedAt: '2024-11-19T16:00:00' },
  { id: 4, tenant_id: 'tenant-b', projectId: 7, title: 'Certificado de conclusão não gera', category: 'bug', priority: 'high', status: 'open', sla: '4h', slaRemaining: '3h 10m', assignee: 11, reporter: 12, createdAt: '2024-11-20T09:30:00', updatedAt: '2024-11-20T09:30:00' },
  { id: 5, tenant_id: 'tenant-a', projectId: 1, title: 'Solicitar acesso para novo colaborador', category: 'request', priority: 'low', status: 'open', sla: '24h', slaRemaining: '20h 00m', assignee: 11, reporter: 12, createdAt: '2024-11-20T07:00:00', updatedAt: '2024-11-20T07:00:00' },
];

export const mockAutomations = [
  { id: 1, tenant_id: 'tenant-a', name: 'Lead Qualificado → Discovery', trigger: 'lead.status = qualified', action: 'create_discovery', status: 'active', runs: 23, lastRun: '2024-11-18', success: 23 },
  { id: 2, tenant_id: 'tenant-b', name: 'Discovery Aprovado → Liberar Proposta', trigger: 'discovery.status = approved', action: 'enable_proposal', status: 'active', runs: 11, lastRun: '2024-11-15', success: 11 },
  { id: 3, tenant_id: 'tenant-a', name: 'Proposta Aprovada → Criar Projeto', trigger: 'proposal.status = approved', action: 'create_project', status: 'active', runs: 8, lastRun: '2024-11-10', success: 8 },
  { id: 4, tenant_id: 'tenant-b', name: 'Projeto Criado → Gerar Backlog', trigger: 'project.status = kickoff', action: 'generate_backlog', status: 'active', runs: 8, lastRun: '2024-11-10', success: 8 },
  { id: 5, tenant_id: 'tenant-a', name: 'Dev Concluído → QA', trigger: 'backlog.status = done AND type = dev', action: 'create_qa_test', status: 'active', runs: 145, lastRun: '2024-11-20', success: 142 },
  { id: 6, tenant_id: 'tenant-b', name: 'QA Aprovado → Liberar Deploy', trigger: 'qa_test.status = passed', action: 'enable_deploy', status: 'active', runs: 38, lastRun: '2024-11-19', success: 38 },
  { id: 7, tenant_id: 'tenant-a', name: 'Deploy Produção → Atualizar Projeto', trigger: 'deployment.env = production AND status = success', action: 'update_project_progress', status: 'active', runs: 15, lastRun: '2024-11-19', success: 15 },
  { id: 8, tenant_id: 'tenant-b', name: 'Projeto 100% → Criar Suporte', trigger: 'project.progress = 100', action: 'create_support_contract', status: 'active', runs: 3, lastRun: '2024-10-01', success: 3 },
  { id: 9, tenant_id: 'tenant-a', name: 'SLA Vencendo → Alertar PM', trigger: 'ticket.sla_remaining < 30m', action: 'notify_pm', status: 'active', runs: 67, lastRun: '2024-11-20', success: 67 },
  { id: 10, tenant_id: 'tenant-b', name: 'Requisito Aprovado → Sprint', trigger: 'backlog.approved = true', action: 'add_to_sprint', status: 'paused', runs: 0, lastRun: null, success: 0 },
];
