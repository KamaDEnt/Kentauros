import { aiService } from '../ai/aiService';

export const PROJECT_SEGMENTS = {
  MVP: 'mvp',
  WEB_APP: 'web_app',
  MOBILE: 'mobile',
  ECOMMERCE: 'ecommerce',
  SAAS: 'saas',
  CUSTOM: 'custom',
};

export const DEVELOPMENT_COMPLEXITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  VERY_HIGH: 'very_high',
};

export const TECHNICAL_STACKS = {
  REACT_VITE: 'react_vite',
  NEXT_JS: 'next_js',
  VUE: 'vue',
  ANGULAR: 'angular',
  NODE_EXPRESS: 'node_express',
  NEST_JS: 'nest_js',
  PYTHON_DJANGO: 'python_django',
  PYTHON_FLASK: 'python_flask',
  JAVA_SPRING: 'java_spring',
  DOTNET: 'dotnet',
};

class ProjectSegmentationService {
  constructor() {
    this.segments = [];
    this.architectures = [];
  }

  log(level, message, context = {}) {
    aiService.addLog('SEGMENT', message, level);
  }

  async analyzeProject(projectData) {
    this.log('info', `Analisando projeto: ${projectData.name}`);

    const segment = this.detectSegment(projectData);
    const complexity = this.evaluateComplexity(projectData);
    const recommendedStack = this.recommendStack(projectData, segment);
    const estimatedTimeline = this.estimateTimeline(projectData, complexity, segment);
    const teamComposition = this.recommendTeam(segment, complexity);
    const developmentPhases = this.generatePhases(segment, complexity);

    const analysis = {
      segment: {
        type: segment,
        confidence: this.calculateConfidence(projectData),
        reasoning: this.getSegmentReasoning(segment, projectData),
      },
      complexity: {
        level: complexity,
        score: this.calculateComplexityScore(projectData),
        factors: this.getComplexityFactors(projectData),
      },
      technicalStack: {
        recommended: recommendedStack,
        alternatives: this.getAlternativeStacks(segment),
        reasoning: this.getStackReasoning(recommendedStack, projectData),
      },
      timeline: {
        estimated: estimatedTimeline,
        phases: developmentPhases,
        milestones: this.generateMilestones(developmentPhases),
      },
      team: {
        composition: teamComposition,
        roles: this.getRoleRequirements(segment, complexity),
        estimatedHours: this.estimateHours(complexity, segment),
      },
      risks: this.identifyRisks(projectData, segment, complexity),
      recommendations: this.generateRecommendations(segment, complexity, projectData),
    };

    this.log('success', `Análise completa: ${segment} (complexidade ${complexity})`);
    this.saveAnalysis(projectData.id, analysis);

    return analysis;
  }

  detectSegment(projectData) {
    const name = (projectData.name || '').toLowerCase();
    const description = (projectData.description || '').toLowerCase();
    const tags = (projectData.tags || []).map(t => t.toLowerCase()).join(' ');

    if (name.includes('mvp') || description.includes('mínimo') || tags.includes('mvp')) {
      return PROJECT_SEGMENTS.MVP;
    }

    if (name.includes('mobile') || name.includes('app') || tags.includes('mobile') || tags.includes('ios') || tags.includes('android')) {
      return PROJECT_SEGMENTS.MOBILE;
    }

    if (name.includes('ecommerce') || name.includes('loja') || tags.includes('ecommerce') || tags.includes('vendas')) {
      return PROJECT_SEGMENTS.ECOMMERCE;
    }

    if (name.includes('saas') || name.includes('assinatura') || tags.includes('saas') || tags.includes('multi-tenant')) {
      return PROJECT_SEGMENTS.SAAS;
    }

    if (tags.includes('web') || tags.includes('dashboard') || tags.includes('portal')) {
      return PROJECT_SEGMENTS.WEB_APP;
    }

    return PROJECT_SEGMENTS.CUSTOM;
  }

  evaluateComplexity(projectData) {
    let score = 0;

    if (projectData.budget && projectData.budget >= 100000) score += 3;
    else if (projectData.budget && projectData.budget >= 50000) score += 2;
    else if (projectData.budget && projectData.budget >= 20000) score += 1;

    const features = projectData.features || [];
    if (features.length >= 10) score += 3;
    else if (features.length >= 5) score += 2;
    else if (features.length >= 2) score += 1;

    const integrations = projectData.integrations || [];
    if (integrations.length >= 5) score += 3;
    else if (integrations.length >= 2) score += 2;
    else if (integrations.length >= 1) score += 1;

    if (projectData.requirements?.length > 15) score += 2;

    if (score >= 8) return DEVELOPMENT_COMPLEXITY.VERY_HIGH;
    if (score >= 5) return DEVELOPMENT_COMPLEXITY.HIGH;
    if (score >= 3) return DEVELOPMENT_COMPLEXITY.MEDIUM;
    return DEVELOPMENT_COMPLEXITY.LOW;
  }

  recommendStack(projectData, segment) {
    const stacks = {
      [PROJECT_SEGMENTS.MVP]: {
        primary: TECHNICAL_STACKS.REACT_VITE,
        secondary: TECHNICAL_STACKS.NODE_EXPRESS,
        database: 'PostgreSQL',
        cloud: 'Vercel + Supabase',
      },
      [PROJECT_SEGMENTS.WEB_APP]: {
        primary: TECHNICAL_STACKS.NEXT_JS,
        secondary: TECHNICAL_STACKS.NODE_EXPRESS,
        database: 'PostgreSQL',
        cloud: 'Vercel + AWS',
      },
      [PROJECT_SEGMENTS.MOBILE]: {
        primary: 'React Native',
        secondary: TECHNICAL_STACKS.NODE_EXPRESS,
        database: 'PostgreSQL + Redis',
        cloud: 'AWS + Vercel',
      },
      [PROJECT_SEGMENTS.ECOMMERCE]: {
        primary: TECHNICAL_STACKS.NEXT_JS,
        secondary: 'Node.js + Strapi',
        database: 'PostgreSQL',
        cloud: 'Vercel + Cloudflare',
      },
      [PROJECT_SEGMENTS.SAAS]: {
        primary: TECHNICAL_STACKS.NEXT_JS,
        secondary: TECHNICAL_STACKS.NEST_JS,
        database: 'PostgreSQL + Redis',
        cloud: 'AWS + Vercel',
      },
      [PROJECT_SEGMENTS.CUSTOM]: {
        primary: TECHNICAL_STACKS.REACT_VITE,
        secondary: TECHNICAL_STACKS.NODE_EXPRESS,
        database: 'PostgreSQL',
        cloud: 'Vercel',
      },
    };

    return stacks[segment] || stacks[PROJECT_SEGMENTS.CUSTOM];
  }

  estimateTimeline(projectData, complexity, segment) {
    const baseMonths = {
      [PROJECT_SEGMENTS.MVP]: 2,
      [PROJECT_SEGMENTS.WEB_APP]: 4,
      [PROJECT_SEGMENTS.MOBILE]: 5,
      [PROJECT_SEGMENTS.ECOMMERCE]: 4,
      [PROJECT_SEGMENTS.SAAS]: 6,
      [PROJECT_SEGMENTS.CUSTOM]: 3,
    };

    const complexityMultiplier = {
      [DEVELOPMENT_COMPLEXITY.LOW]: 0.7,
      [DEVELOPMENT_COMPLEXITY.MEDIUM]: 1,
      [DEVELOPMENT_COMPLEXITY.HIGH]: 1.4,
      [DEVELOPMENT_COMPLEXITY.VERY_HIGH]: 1.8,
    };

    const months = Math.round((baseMonths[segment] || 3) * (complexityMultiplier[complexity] || 1));

    return {
      months,
      weeks: months * 4,
      phases: this.generatePhases(segment, complexity),
      criticalPath: this.getCriticalPath(segment),
    };
  }

  generatePhases(segment, complexity) {
    const phases = [
      { name: 'Discovery & Design', weeks: 2, priority: 'high', agents: ['BA', 'UX'] },
      { name: 'Spec SDD', weeks: 1, priority: 'high', agents: ['BA', 'DEV'] },
      { name: 'MVP/Backend Setup', weeks: 2, priority: 'high', agents: ['DEV'] },
      { name: 'Core Features', weeks: Math.max(2, complexity === 'high' ? 4 : 2), priority: 'high', agents: ['DEV', 'QA'] },
      { name: 'Integrations', weeks: 2, priority: 'medium', agents: ['DEV', 'DEVOPS'] },
      { name: 'QA & Testing', weeks: 1, priority: 'high', agents: ['QA'] },
      { name: 'Deploy & Handoff', weeks: 1, priority: 'medium', agents: ['DEVOPS'] },
    ];

    return phases;
  }

  recommendTeam(segment, complexity) {
    const baseTeam = {
      [PROJECT_SEGMENTS.MVP]: [
        { role: 'BA', hours: 40 },
        { role: 'DEV', hours: 80 },
        { role: 'UX', hours: 20 },
        { role: 'QA', hours: 20 },
      ],
      [PROJECT_SEGMENTS.WEB_APP]: [
        { role: 'BA', hours: 60 },
        { role: 'DEV', hours: 120 },
        { role: 'UX', hours: 40 },
        { role: 'QA', hours: 40 },
        { role: 'DEVOPS', hours: 20 },
      ],
      [PROJECT_SEGMENTS.MOBILE]: [
        { role: 'BA', hours: 60 },
        { role: 'DEV', hours: 160 },
        { role: 'UX', hours: 40 },
        { role: 'QA', hours: 60 },
        { role: 'DEVOPS', hours: 20 },
      ],
      [PROJECT_SEGMENTS.SAAS]: [
        { role: 'BA', hours: 80 },
        { role: 'DEV', hours: 200 },
        { role: 'UX', hours: 60 },
        { role: 'QA', hours: 80 },
        { role: 'DEVOPS', hours: 40 },
      ],
    };

    const multiplier = complexity === 'high' || complexity === 'very_high' ? 1.5 : 1;

    const team = baseTeam[segment] || baseTeam[PROJECT_SEGMENTS.CUSTOM];

    return team.map(member => ({
      ...member,
      hours: Math.round(member.hours * multiplier),
    }));
  }

  generateMilestones(phases) {
    let cumulativeWeeks = 0;
    return phases.map(phase => {
      cumulativeWeeks += phase.weeks;
      return {
        name: phase.name,
        week: cumulativeWeeks,
        deliverables: this.getPhaseDeliverables(phase.name),
      };
    });
  }

  getPhaseDeliverables(phaseName) {
    const deliverables = {
      'Discovery & Design': ['Mapa de requisitos', 'Wireframes', 'Fluxo de usuário'],
      'Spec SDD': ['Documento SDD', 'Critérios de aceite', 'Stack definida'],
      'MVP/Backend Setup': ['Repositório criado', 'CI/CD configurado', 'Schema de banco'],
      'Core Features': ['Features implementadas', 'Testes unitários', 'Documentação de API'],
      'Integrations': ['APIs conectadas', 'Webhooks configurados', 'Logs estabelecidos'],
      'QA & Testing': ['Relatório de QA', 'Testes de regressão', 'Evidências documentadas'],
      'Deploy & Handoff': ['Deploy em produção', 'Documentação final', 'Manual do usuário'],
    };

    return deliverables[phaseName] || ['Entregáveis definidos'];
  }

  calculateConfidence(projectData) {
    let confidence = 50;

    if (projectData.description?.length > 100) confidence += 20;
    if (projectData.features?.length > 0) confidence += 15;
    if (projectData.budget) confidence += 10;
    if (projectData.requirements?.length > 5) confidence += 5;

    return Math.min(100, confidence);
  }

  calculateComplexityScore(projectData) {
    return projectData.budget ? Math.min(10, projectData.budget / 20000) : 5;
  }

  getComplexityFactors(projectData) {
    const factors = [];

    if (projectData.integrations?.length > 3) {
      factors.push({ factor: 'Múltiplas integrações', impact: 'high' });
    }
    if (projectData.features?.length > 5) {
      factors.push({ factor: 'Alto número de features', impact: 'medium' });
    }
    if (projectData.budget > 100000) {
      factors.push({ factor: 'Alto investimento', impact: 'medium' });
    }

    return factors.length ? factors : [{ factor: 'Complexidade padrão', impact: 'low' }];
  }

  getSegmentReasoning(segment, projectData) {
    const reasonings = {
      [PROJECT_SEGMENTS.MVP]: 'Projeto identificado como MVP devido à natureza de validação rápida.',
      [PROJECT_SEGMENTS.WEB_APP]: 'Aplicação web com foco em dashboards e gestão.',
      [PROJECT_SEGMENTS.MOBILE]: 'Aplicativo mobile detectado.',
      [PROJECT_SEGMENTS.ECOMMERCE]: 'Projeto de loja virtual com fluxos de vendas.',
      [PROJECT_SEGMENTS.SAAS]: 'Sistema multi-tenant com foco em recorrência.',
      [PROJECT_SEGMENTS.CUSTOM]: 'Configuração customizada baseada nos dados do projeto.',
    };

    return reasonings[segment] || 'Segmento definido automaticamente.';
  }

  getStackReasoning(stack, projectData) {
    return `Stack recomendada para ${stack.primary} com ${stack.secondary} no backend. ` +
      `Banco de dados: ${stack.database}. Cloud: ${stack.cloud}.`;
  }

  getAlternativeStacks(segment) {
    const alternatives = {
      [PROJECT_SEGMENTS.MVP]: [
        { primary: TECHNICAL_STACKS.NEXT_JS, secondary: TECHNICAL_STACKS.NODE_EXPRESS },
        { primary: TECHNICAL_STACKS.VUE, secondary: TECHNICAL_STACKS.NODE_EXPRESS },
      ],
      [PROJECT_SEGMENTS.WEB_APP]: [
        { primary: TECHNICAL_STACKS.REACT_VITE, secondary: TECHNICAL_STACKS.NEST_JS },
      ],
    };

    return alternatives[segment] || [];
  }

  getRoleRequirements(segment, complexity) {
    const roles = ['BA', 'DEV', 'QA'];
    if (complexity === 'high' || complexity === 'very_high') {
      roles.push('DEVOPS', 'UX');
    }
    return roles;
  }

  estimateHours(complexity, segment) {
    const baseHours = {
      [PROJECT_SEGMENTS.MVP]: 160,
      [PROJECT_SEGMENTS.WEB_APP]: 280,
      [PROJECT_SEGMENTS.MOBILE]: 320,
      [PROJECT_SEGMENTS.ECOMMERCE]: 300,
      [PROJECT_SEGMENTS.SAAS]: 480,
      [PROJECT_SEGMENTS.CUSTOM]: 200,
    };

    const multiplier = {
      [DEVELOPMENT_COMPLEXITY.LOW]: 0.8,
      [DEVELOPMENT_COMPLEXITY.MEDIUM]: 1,
      [DEVELOPMENT_COMPLEXITY.HIGH]: 1.4,
      [DEVELOPMENT_COMPLEXITY.VERY_HIGH]: 1.8,
    };

    return Math.round((baseHours[segment] || 200) * (multiplier[complexity] || 1));
  }

  identifyRisks(projectData, segment, complexity) {
    const risks = [];

    if (projectData.integrations?.length > 3) {
      risks.push({ risk: 'Integrações complexas', mitigation: 'Mapear APIs antes do desenvolvimento' });
    }

    if (complexity === 'high' || complexity === 'very_high') {
      risks.push({ risk: 'Escopo pode crescer', mitigation: 'Definir escopo fixo com entregas incrementais' });
    }

    if (!projectData.budget || projectData.budget < 30000) {
      risks.push({ risk: 'Orçamento limitado', mitigation: 'Priorizar features core do MVP' });
    }

    return risks.length ? risks : [{ risk: 'Nenhum risco identificado', mitigation: 'Prosseguir normalmente' }];
  }

  generateRecommendations(segment, complexity, projectData) {
    const recommendations = [];

    recommendations.push({
      type: 'process',
      priority: 'high',
      text: 'Iniciar com Discovery para validar requisitos antes do desenvolvimento',
    });

    if (segment === PROJECT_SEGMENTS.MVP) {
      recommendations.push({
        type: 'scope',
        priority: 'high',
        text: 'Focar em features essenciais para validar mercado',
      });
    }

    if (complexity === 'high' || complexity === 'very_high') {
      recommendations.push({
        type: 'team',
        priority: 'medium',
        text: 'Considerar time dedicado para acompanhar complexidade',
      });
    }

    return recommendations;
  }

  getCriticalPath(segment) {
    const paths = {
      [PROJECT_SEGMENTS.MVP]: ['Discovery', 'MVP Setup', 'Core Features', 'QA', 'Deploy'],
      [PROJECT_SEGMENTS.WEB_APP]: ['Discovery', 'Design', 'Backend', 'Frontend', 'QA', 'Deploy'],
      [PROJECT_SEGMENTS.MOBILE]: ['Discovery', 'Design', 'API', 'App Development', 'QA', 'Deploy'],
    };

    return paths[segment] || ['Discovery', 'Development', 'QA', 'Deploy'];
  }

  saveAnalysis(projectId, analysis) {
    this.architectures.push({
      projectId,
      analysis,
      createdAt: new Date().toISOString(),
    });
  }

  getAnalysis(projectId) {
    return this.architectures.find(a => a.projectId === projectId)?.analysis;
  }
}

export const projectSegmentationService = new ProjectSegmentationService();