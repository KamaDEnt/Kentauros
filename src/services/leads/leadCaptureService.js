import { aiService } from '../ai/aiService';

export const CAPTURE_SOURCES = {
  FORM: 'form',
  CHATBOT: 'chatbot',
  LANDING_PAGE: 'landing_page',
  LINKEDIN: 'linkedin',
  REFERRAL: 'referral',
  AUTOMATIC: 'automatic_capture',
};

export const LEAD_STAGES = {
  COLD: 'cold',
  WARM: 'warm',
  HOT: 'hot',
  QUALIFIED: 'qualified',
  PROPOSAL: 'proposal',
  WON: 'won',
};

class LeadCaptureService {
  constructor() {
    this.subscribers = [];
    this.capturedLeads = [];
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
    aiService.addLog('CAPTURE', message, level);
    this.notify('log', { level, message, ...context });
  }

  async captureLead(leadData, source = CAPTURE_SOURCES.FORM) {
    this.log('info', `Novo lead capturado via ${source}`, { company: leadData.company });

    const enrichedLead = {
      ...leadData,
      source,
      capturedAt: new Date().toISOString(),
      stage: LEAD_STAGES.COLD,
      score: this.calculateInitialScore(leadData),
      tags: this.generateTags(leadData),
      nurturingStep: 0,
      lastInteraction: new Date().toISOString(),
    };

    this.capturedLeads.push(enrichedLead);
    this.notify('lead_captured', { lead: enrichedLead });

    this.log('success', `Lead ${leadData.company} score: ${enrichedLead.score}`, enrichedLead);

    return enrichedLead;
  }

  calculateInitialScore(leadData) {
    let score = 30;

    if (leadData.email?.includes('gmail') || leadData.email?.includes('hotmail')) {
      score -= 10;
    } else if (leadData.email?.includes('corp') || leadData.email?.includes('empresa')) {
      score += 15;
    }

    if (leadData.company?.toLowerCase().includes('tecnologia') ||
        leadData.company?.toLowerCase().includes('tech') ||
        leadData.company?.toLowerCase().includes('digital')) {
      score += 20;
    }

    if (leadData.industry) {
      const highValueIndustries = ['fintech', 'healthtech', 'ecommerce', 'saas', 'b2b'];
      if (highValueIndustries.some(i => leadData.industry.toLowerCase().includes(i))) {
        score += 15;
      }
    }

    if (leadData.phone) score += 5;
    if (leadData.notes?.length > 50) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  generateTags(leadData) {
    const tags = ['captured'];

    if (leadData.source === CAPTURE_SOURCES.LINKEDIN) {
      tags.push('linkedin');
    } else if (leadData.source === CAPTURE_SOURCES.REFERRAL) {
      tags.push('referral');
    }

    if (leadData.industry) {
      tags.push(leadData.industry.toLowerCase().replace(/\s+/g, '-'));
    }

    if (leadData.company?.toLowerCase().includes('startup')) {
      tags.push('startup');
    }

    return tags;
  }

  async qualifyLead(leadId) {
    const lead = this.capturedLeads.find(l => l.id === leadId || l.capturedAt === leadId);
    if (!lead) {
      throw new Error(`Lead não encontrado`);
    }

    this.log('info', `Qualificando lead ${lead.company}...`);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const qualification = {
      stage: lead.score >= 70 ? LEAD_STAGES.HOT : lead.score >= 40 ? LEAD_STAGES.WARM : LEAD_STAGES.COLD,
      recommendedActions: this.getRecommendedActions(lead),
      estimatedValue: this.estimateValue(lead),
      priority: lead.score >= 70 ? 'high' : lead.score >= 40 ? 'medium' : 'low',
    };

    lead.stage = qualification.stage;
    lead.qualification = qualification;
    lead.qualifiedAt = new Date().toISOString();

    this.log('success', `Lead qualificado como ${qualification.stage}`, qualification);
    this.notify('lead_qualified', { lead, qualification });

    return qualification;
  }

  getRecommendedActions(lead) {
    const actions = [];

    if (lead.score >= 70) {
      actions.push(
        { action: 'schedule_meeting', priority: 'high', message: 'Agendar reunião de descoberta imediatamente' },
        { action: 'send_proposal', priority: 'medium', message: 'Preparar proposta inicial' },
        { action: 'assign_ba', priority: 'medium', message: 'Atribuir BA para análise' }
      );
    } else if (lead.score >= 40) {
      actions.push(
        { action: 'nurture', priority: 'medium', message: 'Iniciar nutrição com conteúdo' },
        { action: 'schedule_call', priority: 'low', message: 'Agendar call de qualificação' }
      );
    } else {
      actions.push(
        { action: 'wait', priority: 'low', message: 'Manter em espera para nutrição futura' }
      );
    }

    return actions;
  }

  estimateValue(lead) {
    const baseValue = 30000;

    if (lead.industry?.toLowerCase().includes('fintech')) return baseValue * 3;
    if (lead.industry?.toLowerCase().includes('ecommerce')) return baseValue * 2;
    if (lead.industry?.toLowerCase().includes('saas')) return baseValue * 2.5;

    return baseValue;
  }

  async startNurturing(leadId) {
    const lead = this.capturedLeads.find(l => l.id === leadId);
    if (!lead) {
      throw new Error(`Lead não encontrado`);
    }

    this.log('info', `Iniciando nutrição para ${lead.company}...`);

    const nurtureSequence = [
      { day: 1, template: 'welcome', subject: 'Bem-vindo à Kentauros' },
      { day: 3, template: 'case_study', subject: 'Caso de sucesso relevante' },
      { day: 7, template: 'consulting_intro', subject: 'Introdução aos nossos serviços' },
      { day: 14, template: 'proposal_preview', subject: 'Proposta personalizada' },
      { day: 21, template: 'meeting_invite', subject: 'Vamos conversar?' },
    ];

    lead.nurturingSequence = nurtureSequence;
    lead.nurturingStatus = 'active';
    lead.nurturingStartedAt = new Date().toISOString();

    this.log('success', `Nutrição iniciada com ${nurtureSequence.length} etapas`, lead);
    this.notify('nurturing_started', { lead });

    return nurtureSequence;
  }

  getCapturedLeads() {
    return this.capturedLeads;
  }

  getLeadById(leadId) {
    return this.capturedLeads.find(l => l.id === leadId);
  }

  generateCaptureForm() {
    return {
      fields: [
        { name: 'company', type: 'text', label: 'Empresa', required: true },
        { name: 'contact', type: 'text', label: 'Contato', required: true },
        { name: 'email', type: 'email', label: 'E-mail', required: true },
        { name: 'phone', type: 'tel', label: 'Telefone', required: false },
        { name: 'industry', type: 'select', label: 'Segmento', options: [
          'Tecnologia', 'Finanças', 'Saúde', 'E-commerce', 'Educação', 'Indústria', 'Varejo', 'Outros'
        ]},
        { name: 'budget', type: 'select', label: 'Orçamento estimado', options: [
          'R$ 10k - R$ 30k', 'R$ 30k - R$ 50k', 'R$ 50k - R$ 100k', 'R$ 100k+', 'A definir'
        ]},
        { name: 'timeline', type: 'select', label: 'Prazo', options: [
          'Imediato', '1-3 meses', '3-6 meses', '6+ meses'
        ]},
        { name: 'notes', type: 'textarea', label: 'Mensagem', required: false },
      ],
      submitButton: 'Solicitar proposta',
      successMessage: 'Obrigado! Nossa equipe entrará em contato em até 24h.',
    };
  }

  generateLandingPageContent() {
    return {
      hero: {
        title: 'Transforme sua operação com tecnologia inteligente',
        subtitle: 'Consultoria especializada em desenvolvimento de projetos digitais sob medida',
        cta: 'Solicitar proposta gratuita',
      },
      benefits: [
        { icon: 'clock', title: 'Agilidade', description: 'Time dedicado focado no seu projeto' },
        { icon: 'shield', title: 'Qualidade', description: 'Padrão de excelência em cada entrega' },
        { icon: 'chart', title: 'Resultados', description: 'Métricas claras e acompanhamento constante' },
      ],
      socialProof: {
        clients: 50,
        projects: 200,
        satisfaction: 98,
      },
      ctaSection: {
        title: 'Pronto para começar?',
        subtitle: 'Agende uma conversa sem compromisso',
        button: 'Falar com especialista',
      },
    };
  }
}

export const leadCaptureService = new LeadCaptureService();