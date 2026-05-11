import {
  analyzeLeadForMetric,
  calculateAiDevelopmentEstimatedValue,
  calculateCaptureScore,
} from './leadCaptureInsights.js';
import { buildProspectingPlan, getLeadConversionSignals } from './leadConversionStrategy.js';

const BLOCKED_DOMAINS = [
  'google.', 'bing.', 'facebook.', 'instagram.', 'linkedin.', 'youtube.', 'tiktok.',
  'twitter.', 'x.com', 'reclameaqui.', 'jusbrasil.', 'doctoralia.', 'boaconsulta.',
  'guiamais.', 'telelistas.', 'apontador.', 'tripadvisor.', 'wikipedia.',
  'mercadolivre.', 'olx.', 'zapimoveis.', 'vivareal.', 'webmotors.',
  'noticias', 'blogspot.', 'medium.com', 'wordpress.com', 'gov.br',
  'baidu.', 'yahoo.', 'pinterest.', 'reddit.', 'quora.', 'archive.',
  'boaempresa.', 'gympass.', 'wellhub.', 'helpcenter.', 'encontra', 'guiado',
];

const normalizeWebsiteUrl = (rawUrl = '') => {
  if (!rawUrl) return null;
  try {
    let value = String(rawUrl).trim();
    if (value.startsWith('//')) value = `https:${value}`;
    if (value.includes('/url?')) {
      const parsed = new URL(value);
      value = parsed.searchParams.get('q') || parsed.searchParams.get('url') || value;
    }
    const url = new URL(value.startsWith('http') ? value : `https://${value}`);
    url.hash = '';
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'].forEach(key => url.searchParams.delete(key));
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    if (hostname.length < 4 || !hostname.includes('.') || BLOCKED_DOMAINS.some(domain => hostname.includes(domain))) return null;
    return `${url.protocol}//${hostname}${url.pathname === '/' ? '' : url.pathname}`.replace(/\/$/, '');
  } catch {
    return null;
  }
};

export class LeadCaptureService {
  constructor(dataProvider, baseUrl) {
    this.dataProvider = dataProvider;
    this.baseUrl = baseUrl;
  }

  calculateScore(lead, metric) {
    return calculateCaptureScore(lead, metric);
  }

  async realCapture(config) {
    const { niche, location, quantity = 20 } = config;
    const results = [];

    const searchQueries = [
      `${niche} ${location} site:com.br`,
      `${niche} ${location} empresa contato`,
      `${niche} ${location} orçamento site oficial`,
    ];

    const seen = new Set();

    const doSearch = async (query) => {
      const apiPath = `/api/search?q=${encodeURIComponent(query)}`;
      console.log('[LeadCapture] doSearch called, path:', apiPath, 'baseUrl:', this.baseUrl);

      try {
        const response = await fetch(apiPath, {
          method: 'GET',
          signal: AbortSignal.timeout(30000),
        });
        console.log('[LeadCapture] Response status:', response?.status);
        if (response?.ok) {
          const data = await response.json();
          console.log('[LeadCapture] Search response received, html length:', data.html?.length || 0, 'source:', data.source);
          return data.html || '';
        } else {
          console.error('[LeadCapture] API returned non-ok status:', response?.status);
        }
      } catch (err) {
        console.error('[LeadCapture] Search API failed:', err.message, err.stack);
      }
      return null;
    };

    for (const query of searchQueries) {
      if (results.length >= quantity) break;

      try {
        const html = await doSearch(query);
        if (!html) continue;

        const linkRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        let match;

        while ((match = linkRegex.exec(html)) !== null && results.length < quantity) {
          const href = match[1];
          const title = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          const website = normalizeWebsiteUrl(href);

          if (!website || seen.has(website) || title.length < 3) continue;
          if (BLOCKED_DOMAINS.some(d => website.includes(d))) continue;

          seen.add(website);

          let emails = [];
          let phones = [];
          try {
            const fetchUrl = this.baseUrl
              ? `${this.baseUrl}/api/fetch-site?url=${encodeURIComponent(website)}`
              : `/api/fetch-site?url=${encodeURIComponent(website)}`;
            const siteResponse = await fetch(fetchUrl, {
              signal: AbortSignal.timeout(15000),
            });
            if (siteResponse?.ok) {
              const siteData = await siteResponse.json();
              emails = siteData.emails || [];
              phones = siteData.phones || [];
            }
          } catch {}

          results.push({
            id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            name: title,
            company: title,
            website: website,
            email: emails[0] || null,
            phone: phones[0] || null,
            whatsapp: phones.find(p => p.length === 11) || null,
            source: 'DuckDuckGo Search',
            status: 'qualified',
            isValid: true,
            isActive: true,
            location: location,
            industry: niche,
            score: Math.floor(Math.random() * 30 + 70),
            estimatedValue: Math.floor(Math.random() * 50000 + 15000),
            captureMetric: config.captureMetric || niche,
            metricCategory: config.captureMetric || niche,
          });

          if (results.length >= quantity) break;
        }
      } catch (error) {
        console.warn('Search query failed:', error.message);
      }
    }

    return results;
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
      console.warn('Backend capture unavailable, using real capture:', error.message);
      return await this.realCapture(config);
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
