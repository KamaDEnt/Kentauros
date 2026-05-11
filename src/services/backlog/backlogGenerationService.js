import { aiService } from '../ai/aiService';
import { projectSegmentationService, PROJECT_SEGMENTS, DEVELOPMENT_COMPLEXITY } from './projectSegmentationService';

class BacklogGenerationService {
  constructor() {
    this.backlogs = [];
    this.taskTemplates = this.loadTaskTemplates();
  }

  log(level, message, context = {}) {
    aiService.addLog('BACKLOG', message, level);
  }

  loadTaskTemplates() {
    return {
      [PROJECT_SEGMENTS.MVP]: [
        { title: 'Configurar projeto base', type: 'setup', priority: 'high', tags: ['setup', 'boilerplate'] },
        { title: 'Implementar autenticação', type: 'feature', priority: 'high', tags: ['auth', 'security'] },
        { title: 'Criar CRUD de entidades principais', type: 'feature', priority: 'high', tags: ['backend', 'api'] },
        { title: 'Desenvolver interface principal', type: 'feature', priority: 'high', tags: ['frontend', 'ui'] },
        { title: 'Implementar listagens e filtros', type: 'feature', priority: 'medium', tags: ['frontend', 'ux'] },
        { title: 'Criar formulário de cadastro', type: 'feature', priority: 'medium', tags: ['frontend', 'forms'] },
        { title: 'Configurar conexão com banco de dados', type: 'setup', priority: 'high', tags: ['database', 'backend'] },
        { title: 'Implementar validações de dados', type: 'task', priority: 'medium', tags: ['validation', 'backend'] },
        { title: 'Configurar ambiente de desenvolvimento', type: 'setup', priority: 'medium', tags: ['devops', 'setup'] },
        { title: 'Escrever testes básicos', type: 'qa', priority: 'medium', tags: ['testing', 'qa'] },
      ],
      [PROJECT_SEGMENTS.WEB_APP]: [
        { title: 'Arquitetura de componentes', type: 'spec', priority: 'high', tags: ['architecture', 'frontend'] },
        { title: 'Sistema de autenticação e roles', type: 'feature', priority: 'high', tags: ['auth', 'security'] },
        { title: 'Dashboard com métricas', type: 'feature', priority: 'high', tags: ['frontend', 'charts'] },
        { title: 'CRUD completo de entidades', type: 'feature', priority: 'high', tags: ['backend', 'api'] },
        { title: 'Sistema de notificações', type: 'feature', priority: 'medium', tags: ['frontend', 'backend'] },
        { title: 'Relatórios e exports', type: 'feature', priority: 'medium', tags: ['reports', 'export'] },
        { title: 'Busca e filtros avançados', type: 'feature', priority: 'medium', tags: ['search', 'ux'] },
        { title: 'Sistema de permissões granular', type: 'feature', priority: 'high', tags: ['auth', 'security'] },
        { title: 'Upload de arquivos', type: 'feature', priority: 'medium', tags: ['storage', 'backend'] },
        { title: 'Testes de integração', type: 'qa', priority: 'high', tags: ['testing', 'qa'] },
        { title: 'Configurar CI/CD', type: 'setup', priority: 'high', tags: ['devops', 'ci'] },
      ],
      [PROJECT_SEGMENTS.MOBILE]: [
        { title: 'Setup React Native/Flutter', type: 'setup', priority: 'high', tags: ['mobile', 'setup'] },
        { title: 'Navegação e roteamento', type: 'feature', priority: 'high', tags: ['navigation', 'ux'] },
        { title: 'Autenticação mobile', type: 'feature', priority: 'high', tags: ['auth', 'mobile'] },
        { title: 'Listas e scrolling otimizado', type: 'feature', priority: 'high', tags: ['performance', 'ux'] },
        { title: 'Formulários com validação', type: 'feature', priority: 'medium', tags: ['forms', 'validation'] },
        { title: 'Offline support', type: 'feature', priority: 'medium', tags: ['offline', 'sync'] },
        { title: 'Notificações push', type: 'feature', priority: 'medium', tags: ['notifications', 'mobile'] },
        { title: 'Integração com APIs nativas', type: 'feature', priority: 'medium', tags: ['native', 'integration'] },
        { title: 'Testes de performance', type: 'qa', priority: 'high', tags: ['performance', 'testing'] },
        { title: 'Build e deploy stores', type: 'deploy', priority: 'high', tags: ['deploy', 'stores'] },
      ],
      default: [
        { title: 'Análise de requisitos', type: 'spec', priority: 'high', tags: ['ba', 'requirements'] },
        { title: 'Configuração de ambiente', type: 'setup', priority: 'high', tags: ['setup', 'devops'] },
        { title: 'Desenvolvimento de features', type: 'feature', priority: 'high', tags: ['dev', 'backend', 'frontend'] },
        { title: 'Testes e QA', type: 'qa', priority: 'high', tags: ['qa', 'testing'] },
        { title: 'Deploy e monitoramento', type: 'deploy', priority: 'medium', tags: ['deploy', 'monitoring'] },
      ],
    };
  }

  async generateBacklog(projectData, segment, complexity) {
    this.log('info', `Gerando backlog para ${projectData.name} (${segment})`);

    const templates = this.taskTemplates[segment] || this.taskTemplates.default;
    const projectRequirements = projectData.requirements || [];
    const projectDecisions = projectData.decisions || [];

    const tasks = [];

    templates.forEach((template, index) => {
      const task = {
        id: `task-${projectData.id}-${Date.now()}-${index}`,
        projectId: projectData.id,
        title: this.adaptTemplateToProject(template.title, projectData),
        description: this.generateTaskDescription(template, projectData),
        type: template.type,
        priority: template.priority,
        status: 'todo',
        order: index + 1,
        tags: [...template.tags],
        estimatedHours: this.estimateTaskHours(template, complexity),
        dependencies: this.getTaskDependencies(index, templates),
        acceptanceCriteria: this.generateAcceptanceCriteria(template),
        relatedRequirements: this.findRelatedRequirements(template, projectRequirements),
      };

      tasks.push(task);
    });

    if (projectDecisions.length > 0) {
      projectDecisions.slice(0, 5).forEach((decision, index) => {
        tasks.push({
          id: `task-dec-${projectData.id}-${Date.now()}-${index}`,
          projectId: projectData.id,
          title: `Implementar: ${decision.title || decision}`,
          description: `Decision-based task: ${decision.description || decision}`,
          type: 'feature',
          priority: decision.priority || 'medium',
          status: 'todo',
          order: tasks.length + 1,
          tags: ['decision', 'implementation'],
          estimatedHours: 8,
          acceptanceCriteria: ['Implementado conforme decisão', 'Validado com stakeholders'],
          relatedDecision: decision,
        });
      });
    }

    if (projectRequirements.length > 0) {
      projectRequirements.slice(0, 10).forEach((req, index) => {
        const reqTitle = req.title || req.name || String(req);
        if (!tasks.some(t => t.title.includes(reqTitle))) {
          tasks.push({
            id: `task-req-${projectData.id}-${Date.now()}-${index}`,
            projectId: projectData.id,
            title: `Implementar: ${reqTitle}`,
            description: req.description || `Requisito funcional: ${reqTitle}`,
            type: 'feature',
            priority: req.priority || 'medium',
            status: 'todo',
            order: tasks.length + 1,
            tags: ['requirement', 'functional'],
            estimatedHours: req.estimatedHours || 8,
            acceptanceCriteria: req.acceptanceCriteria || ['Critérios definidos no levantamento'],
            relatedRequirement: req,
          });
        }
      });
    }

    const backlog = {
      id: `backlog-${projectData.id}-${Date.now()}`,
      projectId: projectData.id,
      projectName: projectData.name,
      segment,
      complexity,
      tasks,
      generatedAt: new Date().toISOString(),
      stats: {
        total: tasks.length,
        byPriority: {
          high: tasks.filter(t => t.priority === 'high').length,
          medium: tasks.filter(t => t.priority === 'medium').length,
          low: tasks.filter(t => t.priority === 'low').length,
        },
        byType: {
          setup: tasks.filter(t => t.type === 'setup').length,
          feature: tasks.filter(t => t.type === 'feature').length,
          spec: tasks.filter(t => t.type === 'spec').length,
          qa: tasks.filter(t => t.type === 'qa').length,
        },
        totalHours: tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
      },
    };

    this.backlogs.push(backlog);
    this.log('success', `Backlog gerado com ${tasks.length} tarefas (${backlog.stats.totalHours}h estimadas)`);

    return backlog;
  }

  adaptTemplateToProject(templateTitle, projectData) {
    const projectName = projectData.name || '';
    const client = projectData.client || '';

    return templateTitle
      .replace('CRUD de entidades', `CRUD para ${projectName}`)
      .replace('Dashboard com métricas', `Dashboard de ${client}`)
      .replace('interface principal', `interface para ${projectName}`);
  }

  generateTaskDescription(template, projectData) {
    const descriptions = {
      setup: `Configurar e preparar ambiente para ${projectData.name}. Inclui ferramentas, dependências e configurações iniciais.`,
      feature: `Implementar feature seguindo os requisitos definidos no Discovery. Validar com QA antes de fechar.`,
      spec: `Criar especificação técnica documentando decisões e critérios de aceite para ${projectData.name}.`,
      qa: `Validar implementações com testes manuais e automatizados. Gerar evidências e documentar resultados.`,
      deploy: `Realizar deploy em ambiente de produção com monitoramento e rollback preparado.`,
    };

    return descriptions[template.type] || `Task para ${projectData.name}`;
  }

  estimateTaskHours(template, complexity) {
    const baseHours = {
      setup: 8,
      feature: 16,
      spec: 8,
      qa: 12,
      deploy: 4,
      task: 8,
    };

    const multiplier = {
      [DEVELOPMENT_COMPLEXITY.LOW]: 0.8,
      [DEVELOPMENT_COMPLEXITY.MEDIUM]: 1,
      [DEVELOPMENT_COMPLEXITY.HIGH]: 1.3,
      [DEVELOPMENT_COMPLEXITY.VERY_HIGH]: 1.6,
    };

    return Math.round((baseHours[template.type] || 8) * (multiplier[complexity] || 1));
  }

  getTaskDependencies(index, templates) {
    if (index === 0) return [];

    const previousTypes = templates.slice(0, index).map(t => t.type);
    const dependencies = [];

    if (previousTypes.includes('setup')) {
      dependencies.push('setup');
    }
    if (previousTypes.includes('spec')) {
      dependencies.push('spec');
    }

    return dependencies;
  }

  generateAcceptanceCriteria(template) {
    const criteria = {
      setup: [
        'Repositório configurado',
        'CI/CD funcionando',
        'Documentação de setup criada',
      ],
      feature: [
        'Feature implementada e testada',
        'Code review aprovado',
        'Testes unitários passando',
        'Documentação atualizada',
      ],
      spec: [
        'SDD documentado',
        'Critérios de aceite definidos',
        'Revisado com BA',
      ],
      qa: [
        'Testes executados',
        'Evidências geradas',
        'Bugs reportados (se houver)',
        'Aprovação de QA',
      ],
      deploy: [
        'Deploy em staging OK',
        'Testes de regressão passando',
        'Monitoramento configurado',
        'Documentação de handoff',
      ],
    };

    return criteria[template.type] || ['Implementado', 'Testado', 'Revisado'];
  }

  findRelatedRequirements(template, requirements) {
    if (!requirements.length) return [];

    return requirements
      .filter(req => {
        const reqText = JSON.stringify(req).toLowerCase();
        return reqText.includes(template.type) || reqText.includes(template.tags[0]);
      })
      .slice(0, 3)
      .map(req => req.title || req.name || String(req));
  }

  getBacklogByProject(projectId) {
    return this.backlogs.find(b => b.projectId === projectId);
  }

  updateTaskStatus(taskId, status, developerId) {
    this.backlogs.forEach(backlog => {
      const task = backlog.tasks.find(t => t.id === taskId);
      if (task) {
        task.status = status;
        task.updatedAt = new Date().toISOString();
        task.updatedBy = developerId;
        task.history = task.history || [];
        task.history.push({
          from: task.status,
          to: status,
          by: developerId,
          at: new Date().toISOString(),
        });
      }
    });
  }

  generateReport(projectId) {
    const backlog = this.getBacklogByProject(projectId);
    if (!backlog) return null;

    return {
      projectId,
      projectName: backlog.projectName,
      segment: backlog.segment,
      generatedAt: backlog.generatedAt,
      stats: backlog.stats,
      progress: this.calculateProgress(backlog.tasks),
      recommendations: this.generateRecommendations(backlog),
    };
  }

  calculateProgress(tasks) {
    const completed = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress' || t.status === 'review').length;

    return {
      completed,
      inProgress,
      pending: tasks.length - completed - inProgress,
      percentage: Math.round((completed / tasks.length) * 100),
    };
  }

  generateRecommendations(backlog) {
    const recommendations = [];

    if (backlog.stats.totalHours > 400) {
      recommendations.push({
        type: 'planning',
        priority: 'high',
        text: 'Projeto de alto esforço - considerar fases/milestones',
      });
    }

    if (backlog.stats.byPriority.high > backlog.stats.total / 2) {
      recommendations.push({
        type: 'prioritization',
        priority: 'medium',
        text: 'Muitas tarefas de alta prioridade - revisar scoping',
      });
    }

    return recommendations;
  }
}

export const backlogGenerationService = new BacklogGenerationService();