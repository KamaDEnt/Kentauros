export const buildClientProjectContext = ({
  clientName,
  lead,
  discovery,
  proposal,
  project,
  backlog = [],
  qaTests = [],
  deployments = [],
  learningEvents = [],
}) => {
  const projectId = project?.id;
  const relevantEvents = learningEvents.filter(event =>
    String(event.project_id || event.metadata?.projectId || '') === String(projectId || '') ||
    String(event.lead_id || event.metadata?.leadId || '') === String(lead?.id || '') ||
    String(event.client_id || '') === String(project?.clientId || '') ||
    event.content?.toLowerCase().includes(String(clientName || '').toLowerCase())
  );

  return {
    clientName: clientName || project?.client || lead?.company,
    lead,
    discovery,
    proposal,
    project,
    decisions: discovery?.decisions || [],
    requirements: discovery?.requirements || discovery?.scope || [],
    tasks: backlog.filter(task => String(task.projectId) === String(projectId)),
    qa: qaTests.filter(test => String(test.projectId) === String(projectId)),
    deployments: deployments.filter(deploy => String(deploy.projectId) === String(projectId)),
    learningEvents: relevantEvents.slice(0, 20),
    generatedAt: new Date().toISOString(),
  };
};

export const buildApprovalChecklist = (stage, context) => {
  const base = [
    'Contexto do cliente anexado',
    'Critérios de aceite definidos',
    'Responsável operacional identificado',
  ];

  const byStage = {
    proposal: ['Discovery aprovado', 'Escopo e valor revisados', 'Documentos comerciais gerados'],
    project: ['Proposta assinada', 'Projeto apto para início', 'Backlog inicial criado'],
    development: ['Spec SDD aprovada', 'Riscos técnicos registrados', 'Prompt de execução salvo'],
    qa: ['Testes executados', 'Evidências anexadas', 'Documentação revisada'],
    deploy: ['QA aprovado', 'Git vinculado', 'Pacote validado localmente'],
  };

  return [...base, ...(byStage[stage] || [])].map(label => ({
    label,
    completed: JSON.stringify(context || {}).toLowerCase().includes(label.split(' ')[0].toLowerCase()),
  }));
};
