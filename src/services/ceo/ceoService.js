import { aiService } from '../ai/aiService';

export const AGENT_ROLES = {
  CEO: 'CEO',
  BA: 'BA',
  UX: 'UX',
  DEV: 'DEV',
  QA: 'QA',
  DEVOPS: 'DEVOPS',
  SUPPORT: 'SUPPORT',
};

export const AGENT_STATUS = {
  IDLE: 'idle',
  HIRED: 'hired',
  WORKING: 'working',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

class CEOService {
  constructor() {
    this.activeProjects = new Map();
    this.hiredAgents = new Map();
    this.approvals = [];
    this.subscribers = [];
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  notify(event, data) {
    this.subscribers.forEach(s => s({ event, data, timestamp: new Date().toISOString() }));
  }

  log(level, message, context = {}) {
    aiService.addLog('CEO', message, level);
    this.notify('log', { level, message, ...context });
  }

  async initialize() {
    this.log('info', 'CEO Agent inicializado. Ecossistema pronto para operação.');
    return this;
  }

  async hireAgent(projectId, role) {
    const project = this.activeProjects.get(projectId);
    if (!project) {
      throw new Error(`Projeto ${projectId} não encontrado`);
    }

    const agentKey = `${projectId}-${role}`;
    if (this.hiredAgents.has(agentKey)) {
      this.log('info', `Agente ${role} já contratado para projeto ${projectId}`);
      return this.hiredAgents.get(agentKey);
    }

    const agent = {
      id: agentKey,
      role,
      status: AGENT_STATUS.HIRED,
      hiredAt: new Date().toISOString(),
      projectId,
      tasks: [],
      approvals: [],
      documentation: [],
    };

    this.hiredAgents.set(agentKey, agent);
    this.log('success', `Agente ${role} contratado com sucesso para ${project.name}`, { role, projectId: project.id });

    this.notify('agent_hired', { agent, projectId });

    return agent;
  }

  async installAgent(projectId, role) {
    const agent = await this.hireAgent(projectId, role);

    const installationSteps = this.getAgentInstallSteps(role);

    for (const step of installationSteps) {
      this.log('info', `Instalando ${step.name}...`, { role, step: step.name });
      await new Promise(resolve => setTimeout(resolve, 500));
      this.log('success', `${step.name} instalado`, { role });
    }

    this.notify('agent_installed', { agent, projectId });
    return agent;
  }

  getAgentInstallSteps(role) {
    const baseSteps = [
      { name: 'Configurar ambiente', description: 'Preparar workspace do agente' },
      { name: 'Sincronizar contexto', description: 'Carregar dados do projeto' },
      { name: 'Estabelecer comunicação', description: 'Conectar ao CEO Agent' },
    ];

    const roleSpecificSteps = {
      BA: [
        { name: 'Carregar scripts de descoberta', description: 'Baixar templates BA' },
        { name: 'Configurar validação de requisitos', description: 'Inicializar regras BA' },
      ],
      UX: [
        { name: 'Carregar design tokens', description: 'Baixar padrões visuais' },
        { name: 'Configurar sistema de componentes', description: 'Inicializar biblioteca UI' },
      ],
      DEV: [
        { name: 'Configurar stack técnica', description: 'Definir tecnologias' },
        { name: 'Preparar ambiente de desenvolvimento', description: 'Inicializar IDE patterns' },
      ],
      QA: [
        { name: 'Carregar cenários de teste', description: 'Baixar templates Gherkin' },
        { name: 'Configurar pipeline de testes', description: 'Inicializar frameworks' },
      ],
      DEVOPS: [
        { name: 'Configurar infraestrutura', description: 'Preparar cloud/CDN' },
        { name: 'Estabelecer CI/CD', description: 'Inicializar pipelines' },
      ],
    };

    return [...baseSteps, ...(roleSpecificSteps[role] || [])];
  }

  setProjectContext(projectId, projectData) {
    this.activeProjects.set(projectId, {
      ...projectData,
      status: 'active',
      startedAt: new Date().toISOString(),
      agents: [],
      segments: [],
      approvals: [],
    });

    this.log('info', `Projeto ${projectData.name} adicionado ao ecossistema`, { projectId });
    this.notify('project_added', { projectId, project: projectData });

    return this.activeProjects.get(projectId);
  }

  async distributeWork(agentKey, work) {
    const agent = this.hiredAgents.get(agentKey);
    if (!agent) {
      throw new Error(`Agente ${agentKey} não encontrado`);
    }

    agent.tasks.push({
      id: `task-${Date.now()}`,
      work,
      status: 'assigned',
      assignedAt: new Date().toISOString(),
    });

    this.log('info', `Trabalho distribuído para ${agent.role}`, { agentKey, work: work.title });
    this.notify('work_distributed', { agentKey, work });

    return agent.tasks[agent.tasks.length - 1];
  }

  async requestApproval(agentKey, work, output) {
    const agent = this.hiredAgents.get(agentKey);
    if (!agent) {
      throw new Error(`Agente ${agentKey} não encontrado`);
    }

    const approval = {
      id: `approval-${Date.now()}`,
      agentKey,
      agentRole: agent.role,
      work,
      output,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewer: null,
      comments: [],
    };

    this.approvals.push(approval);
    this.log('info', `Aprovação solicitada para ${agent.role}`, { approvalId: approval.id, work: work.title });
    this.notify('approval_requested', { approval });

    return approval;
  }

  async approveWork(approvalId, developerId, comments = '') {
    const approval = this.approvals.find(a => a.id === approvalId);
    if (!approval) {
      throw new Error(`Aprovação ${approvalId} não encontrada`);
    }

    approval.status = 'approved';
    approval.reviewedAt = new Date().toISOString();
    approval.reviewer = developerId;
    approval.comments.push({ text: comments, by: developerId, at: new Date().toISOString() });

    const agent = this.hiredAgents.get(approval.agentKey);
    if (agent) {
      agent.status = AGENT_STATUS.APPROVED;
      agent.approvals.push(approval);
    }

    this.log('success', `Trabalho aprovado pelo desenvolvedor`, { approvalId, developerId });
    this.notify('work_approved', { approval });

    return approval;
  }

  async rejectWork(approvalId, developerId, reason) {
    const approval = this.approvals.find(a => a.id === approvalId);
    if (!approval) {
      throw new Error(`Aprovação ${approvalId} não encontrada`);
    }

    approval.status = 'rejected';
    approval.reviewedAt = new Date().toISOString();
    approval.reviewer = developerId;
    approval.comments.push({ text: reason, by: developerId, at: new Date().toISOString() });

    const agent = this.hiredAgents.get(approval.agentKey);
    if (agent) {
      agent.status = AGENT_STATUS.REJECTED;
      agent.approvals.push(approval);
    }

    this.log('warning', `Trabalho rejeitado: ${reason}`, { approvalId, developerId, reason });
    this.notify('work_rejected', { approval, reason });

    return approval;
  }

  async runAgentWork(agentKey, input) {
    const agent = this.hiredAgents.get(agentKey);
    if (!agent) {
      throw new Error(`Agente ${agentKey} não encontrado`);
    }

    this.log('info', `${agent.role} iniciando trabalho...`, { agentKey });
    agent.status = AGENT_STATUS.WORKING;

    const result = await aiService.runAgent(agent.role, input);

    agent.status = AGENT_STATUS.IDLE;
    agent.documentation.push({
      type: agent.role,
      content: result.text,
      timestamp: new Date().toISOString(),
    });

    this.log('success', `${agent.role} completou trabalho`, { agentKey });
    this.notify('agent_work_completed', { agent, result });

    return result;
  }

  getProjectAgents(projectId) {
    const agents = [];
    this.hiredAgents.forEach((agent, key) => {
      if (key.startsWith(`${projectId}-`)) {
        agents.push(agent);
      }
    });
    return agents;
  }

  getPendingApprovals() {
    return this.approvals.filter(a => a.status === 'pending');
  }

  getAgentStatus(projectId) {
    const agents = this.getProjectAgents(projectId);
    return {
      total: agents.length,
      working: agents.filter(a => a.status === AGENT_STATUS.WORKING).length,
      approved: agents.filter(a => a.status === AGENT_STATUS.APPROVED).length,
      rejected: agents.filter(a => a.status === AGENT_STATUS.REJECTED).length,
      agents: agents.map(a => ({
        role: a.role,
        status: a.status,
        tasksCount: a.tasks.length,
        lastTask: a.tasks[a.tasks.length - 1],
      })),
    };
  }

  generateProjectReport(projectId) {
    const project = this.activeProjects.get(projectId);
    const agents = this.getProjectAgents(projectId);
    const approvals = this.approvals.filter(a =>
      agents.some(agent => agent.id === a.agentKey)
    );

    return {
      project,
      agents: agents.map(a => ({
        role: a.role,
        status: a.status,
        tasksCompleted: a.tasks.filter(t => t.status === 'completed').length,
        totalTasks: a.tasks.length,
        documentation: a.documentation.length,
      })),
      approvals: {
        total: approvals.length,
        pending: approvals.filter(a => a.status === 'pending').length,
        approved: approvals.filter(a => a.status === 'approved').length,
        rejected: approvals.filter(a => a.status === 'rejected').length,
      },
      generatedAt: new Date().toISOString(),
    };
  }
}

export const ceoService = new CEOService();