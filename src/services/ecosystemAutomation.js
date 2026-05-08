export const AUTOMATION_TEMPLATES = [
  {
    name: 'Lead qualificado -> Follow-up comercial',
    trigger: 'lead.status = qualified AND emailStatus != sent',
    action: 'schedule_commercial_followup',
    module: 'commercial',
  },
  {
    name: 'Discovery aprovado -> Proposta',
    trigger: 'discovery.status = approved',
    action: 'create_proposal_from_discovery',
    module: 'commercial',
  },
  {
    name: 'Proposta assinada -> Projeto',
    trigger: 'proposal.status = signed',
    action: 'create_project_backlog_sdd',
    module: 'delivery',
  },
  {
    name: 'Backlog em revisão -> QA',
    trigger: 'backlog.status = review',
    action: 'create_qa_test',
    module: 'qa',
  },
  {
    name: 'QA aprovado -> Deploy liberado',
    trigger: 'qa.status = passed',
    action: 'enable_deploy',
    module: 'deploy',
  },
];

export const createAutomationLog = (status, message, metadata = {}) => ({
  id: crypto.randomUUID?.() || `auto_log_${Date.now()}`,
  status,
  message,
  metadata,
  createdAt: new Date().toISOString(),
});

export const runAutomationAction = ({ automation, data, actions }) => {
  const action = automation.action;
  const now = new Date().toISOString();

  if (action === 'schedule_commercial_followup') {
    const lead = data.leads.find(item => item.status === 'qualified' && item.emailStatus !== 'sent');
    if (!lead) return { status: 'skipped', message: 'Nenhum lead qualificado aguardando follow-up.' };
    actions.updateLead(lead.id, {
      nextFollowUpAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      followUpStatus: 'scheduled',
    });
    return { status: 'success', message: `Follow-up agendado para ${lead.company}.`, entityId: lead.id };
  }

  if (action === 'create_qa_test') {
    const task = data.backlog.find(item => item.status === 'review' && !data.qaTests.some(test => test.taskId === item.id));
    if (!task) return { status: 'skipped', message: 'Nenhuma tarefa em revisão sem QA.' };
    const qa = actions.addQaTest({
      projectId: task.projectId,
      taskId: task.id,
      title: `QA automatizado - ${task.title}`,
      type: 'automated_sdd',
      status: 'pending',
      environment: 'staging',
      documentation: 'Gerado automaticamente a partir de tarefa em validação.',
    });
    return { status: 'success', message: `QA criado para ${task.title}.`, entityId: qa.id };
  }

  if (action === 'enable_deploy') {
    const qa = data.qaTests.find(item => item.status === 'passed');
    if (!qa) return { status: 'skipped', message: 'Nenhum QA aprovado encontrado.' };
    const deploy = actions.addDeployment({
      projectId: qa.projectId,
      env: 'staging',
      version: 'ready',
      status: 'ready',
      notes: 'Deploy liberado automaticamente após QA aprovado.',
    });
    return { status: 'success', message: `Deploy liberado para projeto ${qa.projectId}.`, entityId: deploy.id };
  }

  if (action === 'create_project_backlog_sdd') {
    return { status: 'skipped', message: 'A criação de projeto por proposta é executada no workflow comercial.' };
  }

  if (action === 'create_proposal_from_discovery') {
    return { status: 'skipped', message: 'A criação de proposta por Discovery é executada no workflow comercial.' };
  }

  return { status: 'success', message: `${automation.name} executada sem ação operacional vinculada em modo pré-pronto.`, executedAt: now };
};
