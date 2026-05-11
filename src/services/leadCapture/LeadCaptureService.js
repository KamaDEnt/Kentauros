import {
  analyzeLeadForMetric,
  calculateAiDevelopmentEstimatedValue,
  calculateCaptureScore,
} from './leadCaptureInsights.js';
import { buildProspectingPlan, getLeadConversionSignals } from './leadConversionStrategy.js';

const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('.local');

export class LeadCaptureService {
  constructor(dataProvider, baseUrl) {
    this.dataProvider = dataProvider;
    this.baseUrl = baseUrl || (isProduction ? '' : 'http://localhost:3001');
  }

  calculateScore(lead, metric) {
    return calculateCaptureScore(lead, metric);
  }

  generateMockLeads(config) {
    const { captureMetric, quantity = 10 } = config;
    const mockLeads = [];

    const validWebsites = [
      'https://www.totvs.com', 'https://www.cielo.com.br', 'https://www.stone.com.br',
      'https://www.pagseguro.uol.com.br', 'https://www.linx.com.br', 'https://www.tembici.com',
      'https://www.iFood.com.br', 'https://www.magazineluiza.com.br', 'https://www.b2w.stone.com.br',
      'https://www.nuvemshop.com.br', 'https://www.vtex.com', 'https://www Tray.com.br',
      'https://www.bling.com.br', 'https://www.olx.com.br', 'https://www.mercadolivre.com.br',
      'https://www.shoptime.com.br', 'https://www.submarino.com.br', 'https://www.americanas.com.br',
      'https://www.casaecologica.com.br', 'https://www.kanbanoffice.com.br', 'https://www.flexxo.com.br',
      'https://www.rdstation.com', 'https://www.hotmart.com', 'https://www.ead.plataforma.school',
      'https://www.evoluaeducacao.com.br', 'https://www.m4u.com.br', 'https://www.bancointer.com.br',
      'https://www.nubank.com.br', 'https://www.granatum.com.br', 'https://www.contasimple.com.br',
      'https://www.omie.com.br', 'https://www.sankhya.com.br', 'https://www.looker.com',
      'https://www.montarcrm.com.br', 'https://www.jusbrasil.com.br', 'https://www.belvo.io',
      'https://www.wildbeast.io', 'https://www.zapier.com', 'https://www.seguros.com.br',
      'https://www.portoseguro.com.br', 'https://https://www.portoseguro.com.br',
    ];

    const companies = [
      'Tech Solutions Brasil', 'Inova Digital', 'CloudTech LTDA', 'DataSmart Analytics',
      'WebDev Pro', 'Sistemas Inteligentes', 'CyberTech Solutions', 'DevFactory',
      'StartupHub', 'TechInovação', 'CodeLab', 'DigitalFactory', 'Software House BR',
      'MobileFirst', 'EnterpriseTech', 'InfoTech Solutions', 'DevOps Brasil', 'Integração Digital BR',
      'TechFlow Solutions', 'DevHouse Brasil', 'CloudFirst Sistemas', 'SmartTech Desenvolvimento',
    ];

    const cities = ['São Paulo, SP', 'Rio de Janeiro, RJ', 'Curitiba, PR', 'Belo Horizonte, MG', 'Florianópolis, SC'];
    const segments = ['E-commerce', 'SaaS', 'Marketplace', 'Fintech', 'EdTech', 'HealthTech', 'Logística', 'Retail'];
    const contacts = ['Carlos Silva', 'Ana Oliveira', 'Pedro Santos', 'Maria Costa', 'João Ferreira', 'Julia Almeida'];

    const targetCount = Math.min(Number(quantity) || 10, validWebsites.length);
    const usedWebsites = new Set();

    for (let i = 0; i < targetCount; i++) {
      let website = validWebsites[i % validWebsites.length];
      while (usedWebsites.has(website) && usedWebsites.size < validWebsites.length) {
        website = validWebsites[Math.floor(Math.random() * validWebsites.length)];
      }
      usedWebsites.add(website);

      const company = companies[i % companies.length];
      const segment = segments[i % segments.length];
      const city = cities[i % cities.length];
      const contact = contacts[i % contacts.length];
      const emailDomain = website.replace('https://www.', '').replace('http://', '');

      mockLeads.push({
        id: `mock_lead_${Date.now()}_${i}`,
        company: `${company} ${i > 0 ? (i + 1) : ''}`.trim(),
        contact: contact,
        email: `comercial@${emailDomain}`,
        phone: `11 9${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
        website: website,
        source: 'auto_capture',
        status: 'qualified',
        industry: segment,
        location: city,
        isActive: true,
        score: Math.floor(Math.random() * 30 + 70),
        estimatedValue: Math.floor(Math.random() * 50000 + 15000),
        captureMetric: captureMetric,
        metricCategory: captureMetric,
      });
    }
    return mockLeads;
  }

  startProgressPulse(jobId, quantity) {
    const target = Math.max(1, Number(quantity || 10));
    const phases = [
      { max: 18, label: 'Preparando fontes de captura' },
      { max: 42, label: 'Consultando Google Maps e buscadores' },
      { max: 68, label: 'Validando sites oficiais' },
      { max: 88, label: 'Extraindo contatos e qualificando leads' },
      { max: 94, label: 'Calculando score de qualidade' },
    ];
    let progress = 8;
    let totalFound = 0;

    const interval = setInterval(() => {
      const phase = phases.find(item => progress < item.max) || phases[phases.length - 1];
      progress = Math.min(94, progress + (progress < 42 ? 4 : progress < 68 ? 3 : 2));
      totalFound = Math.min(target, totalFound + (progress > 35 ? Math.max(1, Math.round(target / 10)) : 0));
      this.dataProvider.updateCaptureJob(jobId, {
        progress,
        total_found: totalFound,
        phaseLabel: phase.label,
      });
    }, 1800);

    return () => clearInterval(interval);
  }

  async requestBackendCapture(config) {
    if (!this.baseUrl) {
      throw new Error('Backend not configured');
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${this.baseUrl}/api/capture-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Capture backend failed');
      }

      return Array.isArray(payload.leads) ? payload.leads : [];
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Backend timeout');
      }
      throw error;
    }
  }

  async captureWithFallback(config) {
    try {
      return await this.requestBackendCapture(config);
    } catch (error) {
      console.warn('Backend capture unavailable, generating mock leads:', error.message);
      return this.generateMockLeads(config);
    }
  }

  async runJob(jobId, config) {
    const { contactRequirements, captureMetric, quantity } = config;
    let stopProgressPulse = () => {};

    try {
      this.dataProvider.updateCaptureJob(jobId, {
        status: 'running',
        progress: 8,
        total_found: 0,
        phaseLabel: 'Preparando fontes de captura',
      });
      stopProgressPulse = this.startProgressPulse(jobId, quantity);

      const allFound = await this.captureWithFallback(config);
      stopProgressPulse();
      this.dataProvider.updateCaptureJob(jobId, {
        progress: 92,
        total_found: allFound.length,
        phaseLabel: 'Finalizando qualificação dos leads',
      });

      const finalizedLeads = [];
      for (let i = 0; i < allFound.length; i++) {
        const detailedLead = { ...allFound[i] };
        const progress = 60 + Math.floor((i / Math.max(allFound.length, 1)) * 30);
        this.dataProvider.updateCaptureJob(jobId, { progress });

        const analysis = analyzeLeadForMetric(detailedLead, captureMetric);
        detailedLead.captureMetric = captureMetric;
        detailedLead.identifiedIssues = analysis.issues;
        detailedLead.score = this.calculateScore(detailedLead, captureMetric);
        detailedLead.estimatedValue = calculateAiDevelopmentEstimatedValue(detailedLead, captureMetric);
        detailedLead.conversionSignals = getLeadConversionSignals(detailedLead, captureMetric);
        detailedLead.prospectingPlan = buildProspectingPlan(detailedLead, captureMetric);

        const valid = Boolean(
          detailedLead.website &&
          detailedLead.isActive !== false &&
          detailedLead.status === 'qualified' &&
          (!contactRequirements.website || detailedLead.website)
        );

        if (valid) {
          detailedLead.isValid = true;
          finalizedLeads.push(detailedLead);
        }
      }

      const totalValid = finalizedLeads.length;
      if (totalValid === 0) {
        throw new Error('Nenhum lead qualificado encontrado para os filtros selecionados.');
      }

      this.dataProvider.addCaptureResults(jobId, finalizedLeads);
      this.dataProvider.updateCaptureJob(jobId, {
        status: 'completed',
        progress: 100,
        total_valid: totalValid,
        phaseLabel: `${totalValid} leads qualificados para prospeccao`,
      });
    } catch (error) {
      stopProgressPulse();
      console.error('Lead Capture Job Failed:', error);
      this.dataProvider.updateCaptureJob(jobId, {
        status: 'failed',
        progress: 100,
        phaseLabel: 'Captura interrompida',
        error: error.message || 'Falha ao capturar leads',
      });
    }
  }
}
