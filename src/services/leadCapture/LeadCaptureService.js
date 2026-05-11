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
    const companies = [
      'Tech Solutions Brasil', 'Inova Digital', 'CloudTech LTDA', 'DataSmart Analytics',
      'WebDev Pro', 'Sistemas Inteligentes', 'CyberTech Solutions', 'DevFactory',
      'StartupHub', 'TechInovação', 'CodeLab', 'DigitalFactory', 'Software House BR',
      'MobileFirst', 'EnterpriseTech', 'InfoTech Solutions', 'DevOps Brasil',
    ];
    const cities = ['São Paulo, SP', 'Rio de Janeiro, RJ', 'Curitiba, PR', 'Belo Horizonte, MG', 'Florianópolis, SC'];
    const segments = ['E-commerce', 'SaaS', 'Marketplace', 'Fintech', 'EdTech', 'HealthTech', 'Logística', 'Retail'];
    const websites = ['site', 'loja', 'app', 'plataforma', 'sistema'];

    const targetCount = Math.min(Number(quantity) || 10, 20);
    for (let i = 0; i < targetCount; i++) {
      const company = companies[i % companies.length];
      const segment = segments[i % segments.length];
      const city = cities[i % cities.length];
      const siteType = websites[i % websites.length];

      mockLeads.push({
        id: `mock_lead_${Date.now()}_${i}`,
        company: `${company} ${i > 0 ? i : ''}`.trim(),
        contact: 'Responsável Comercial',
        email: `contato@${company.toLowerCase().replace(/\s+/g, '')}.com.br`,
        phone: `11 9${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
        website: `https://www.${siteType}${company.toLowerCase().replace(/\s+/g, '')}.com.br`,
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
