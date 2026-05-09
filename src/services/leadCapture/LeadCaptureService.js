import {
  analyzeLeadForMetric,
  calculateAiDevelopmentEstimatedValue,
  calculateCaptureScore,
} from './leadCaptureInsights.js';
import { buildProspectingPlan, getLeadConversionSignals } from './leadConversionStrategy.js';

export class LeadCaptureService {
  constructor(dataProvider, baseUrl = 'http://localhost:3001') {
    this.dataProvider = dataProvider;
    this.baseUrl = baseUrl;
  }

  calculateScore(lead, metric) {
    return calculateCaptureScore(lead, metric);
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
    const response = await fetch(`${this.baseUrl}/api/capture-leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Capture backend failed');
    }

    return Array.isArray(payload.leads) ? payload.leads : [];
  }

  async captureWithFallback(config) {
    try {
      return await this.requestBackendCapture(config);
    } catch (error) {
      const relaxedConfig = {
        ...config,
        contactRequirements: {
          ...(config.contactRequirements || {}),
          email: false,
          phone: false,
          whatsapp: false,
          website: true,
        },
      };

      try {
        return await this.requestBackendCapture(relaxedConfig);
      } catch {
        throw error;
      }
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
