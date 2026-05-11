// LeadCaptureService - Real lead capture with functional websites
import {
  analyzeLeadForMetric,
  calculateAiDevelopmentEstimatedValue,
  calculateCaptureScore,
} from './leadCaptureInsights.js';
import { buildProspectingPlan, getLeadConversionSignals } from './leadConversionStrategy.js';

// Blocked domains - sites without business opportunity
const BLOCKED_DOMAINS = [
  'google.com', 'google.com.br', 'bing.com', 'facebook.com', 'instagram.com',
  'linkedin.com', 'youtube.com', 'tiktok.com', 'twitter.com', 'x.com',
  'wikipedia.org', 'github.com', 'stackoverflow.com', 'reddit.com',
  'mercadolivre.com.br', 'olx.com.br', 'amazon.com.br', 'shopee.com.br',
  'globo.com', 'uol.com.br', 'terra.com.br', 'ig.com.br',
  'gov.br', 'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com',
  'booking.com', 'tripadvisor.com', 'airbnb.com',
  'pinterest.com', 'quora.com', 'medium.com', 'wordpress.com', 'blogspot.com',
  'guiamais.com.br', 'telelistas.net', 'apontador.com.br', 'wisemap.com.br',
  'reclameaqui.com.br', 'jusbrasil.com.br', 'doctoralia.com.br', 'boaconsulta.com.br',
  'zapimoveis.com.br', 'vivareal.com.br', 'imovelweb.com.br', 'webmotors.com.br',
  'tudocelular.com', 'techtudo.com.br', 'canaltech.com.br',
];

const NICHE_SPECIFIC_BLOCKS = {
  'advocacia': ['juris.com.br', 'jurisprudencia.com.br', 'diariojuridico.com.br', 'legis.com.br'],
  'medicina': ['saude.vivo.com.br', 'minsaude.gov.br', 'saude.gov.br'],
  'restaurante': ['tripadvisor.com', 'google.com/maps', 'guia123.com.br', 'restaurantes.com.br'],
  'imobiliaria': ['zapimoveis.com.br', 'vivareal.com.br', 'imovelweb.com.br'],
};

// Score calculation based on opportunity analysis
const calculateOpportunityScore = (lead, captureMetric) => {
  let score = 40;

  // Website factors
  if (lead.website) {
    const hasHttps = lead.website.startsWith('https://');
    score += hasHttps ? 5 : 10; // Prefer non-https as opportunity

    // Check if it looks like a real business site (not a subdomain of a platform)
    const hostname = new URL(lead.website).hostname.replace('www.', '');
    const isPlatformSubdomain = hostname.includes('.wordpress.') ||
                               hostname.includes('.wix.') ||
                               hostname.includes('.squarespace.') ||
                               hostname.includes('.shopify.') ||
                               hostname.includes('.tiiny.') ||
                               hostname.includes('.webnode.') ||
                               hostname.includes('.weebly.') ||
                               hostname.includes('.godaddy.') ||
                               hostname.includes('.site123.');
    score += isPlatformSubdomain ? 15 : 5; // Platform sites need reformulation

    // Check domain age indicators (fake/subdomain = low quality)
    if (hostname.split('.').length > 3) score += 10; // subdomain depth
  }

  // Contact info
  if (lead.email && !lead.email.includes('@gmail') && !lead.email.includes('@hotmail')) {
    score += 15;
  } else if (lead.email) {
    score -= 10;
  }

  if (lead.phone) {
    score += 10;
    if (lead.phone.startsWith('11') || lead.phone.startsWith('21')) {
      score += 5; // SP/RJ numbers are higher value
    }
  }

  if (lead.whatsapp) score += 5;

  // Google/Bing presence
  if (lead.snippet && lead.snippet.length > 50) {
    score += 10;
  }

  // Business indicators in title
  const title = lead.name || '';
  const businessWords = ['ltda', 'me', 'epp', 's/a', 'sa', 'grupo', 'instituto', 'centro', 'consultoria', 'solutions', 'servicos'];
  if (businessWords.some(w => title.toLowerCase().includes(w))) {
    score += 10;
  }

  // Metric-specific scoring
  switch (captureMetric) {
    case 'website_reformulation':
      // Prefer sites that exist but look outdated
      score += lead.website ? 5 : -20;
      break;
    case 'new_website':
      // Looking for potential new projects
      score += lead.website ? 0 : 5;
      break;
    case 'website_correction':
      // Fix existing sites
      score += lead.website ? 10 : -15;
      break;
  }

  return Math.min(95, Math.max(15, score));
};

// Normalize website URL
const normalizeWebsite = (rawUrl) => {
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
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'ref'].forEach(k => url.searchParams.delete(k));
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    return `${url.protocol}//${hostname}${url.pathname === '/' ? '' : url.pathname}`.replace(/\/$/, '');
  } catch {
    return null;
  }
};

// Check if domain should be blocked
const isBlockedDomain = (hostname, niche) => {
  const lower = hostname.toLowerCase();
  if (BLOCKED_DOMAINS.some(d => lower.includes(d))) return true;

  for (const [key, domains] of Object.entries(NICHE_SPECIFIC_BLOCKS)) {
    if (niche.toLowerCase().includes(key)) {
      if (domains.some(d => lower.includes(d))) return true;
    }
  }

  return false;
};

// Validate website is real and functional
const validateWebsite = async (website) => {
  try {
    const response = await fetch(website, {
      method: 'HEAD',
      signal: AbortSignal.timeout(8000),
    });
    return response.ok || response.status === 301 || response.status === 302;
  } catch {
    // Try HEAD failed, maybe GET will work
    try {
      const response = await fetch(website, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
};

export class LeadCaptureService {
  constructor(dataProvider, baseUrl) {
    this.dataProvider = dataProvider;
    this.baseUrl = baseUrl || this.getDefaultBaseUrl();
  }

  getDefaultBaseUrl() {
    const isProd = window.location.hostname !== 'localhost' && !window.location.hostname.includes('.local');
    return isProd ? window.location.origin : 'http://localhost:3001';
  }

  calculateScore(lead, metric) {
    return calculateCaptureScore(lead, metric);
  }

  async realCapture(config) {
    const { niche, location, quantity = 20, captureMetric = 'website_reformulation' } = config;
    const results = [];
    const seen = new Set();

    console.log('[LeadCapture] Starting capture:', { niche, location, quantity, captureMetric });
    console.log('[LeadCapture] Using baseUrl:', this.baseUrl);

    // Search queries optimized for finding businesses
    const searchQueries = [
      `${niche} ${location} site:.com.br -youtube -facebook -instagram`,
      `${niche} ${location} empresa contato site:.com.br`,
      `${niche} ${location} solucao servicos site:.com.br`,
    ];

    // Try backend first (Node.js server)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${this.baseUrl}/api/capture-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, location, quantity, captureMetric }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log('[LeadCapture] Backend returned', data.leads?.length || 0, 'leads');
        if (data.leads && data.leads.length > 0) {
          return data.leads.map(lead => ({
            ...lead,
            score: calculateOpportunityScore(lead, captureMetric),
            estimatedValue: calculateAiDevelopmentEstimatedValue(lead, captureMetric),
            identifiedIssues: analyzeLeadForMetric(lead, captureMetric).issues,
            conversionSignals: getLeadConversionSignals(lead, captureMetric),
            prospectingPlan: buildProspectingPlan(lead, captureMetric),
          }));
        }
      }
    } catch (err) {
      console.log('[LeadCapture] Backend not available:', err.message);
    }

    // Try direct search via backend proxy endpoints
    console.log('[LeadCapture] Trying direct search...');

    for (const query of searchQueries) {
      if (results.length >= quantity) break;

      try {
        const response = await fetch(`${this.baseUrl}/api/search?q=${encodeURIComponent(query)}`, {
          method: 'GET',
          signal: AbortSignal.timeout(30000),
        });

        if (response.ok) {
          const data = await response.json();
          const searchResults = data.results || data.html ? this.parseHtmlResults(data.html || '') : [];

          console.log(`[LeadCapture] Query "${query}" returned ${searchResults.length} results`);

          for (const item of searchResults) {
            if (results.length >= quantity) break;

            const website = normalizeWebsite(item.link);
            if (!website) continue;

            const hostname = new URL(website).hostname.replace('www.', '');
            if (isBlockedDomain(hostname, niche)) continue;
            if (seen.has(hostname)) continue;
            seen.add(hostname);

            // Fetch site data
            let siteData = { emails: [], phones: [], meta: {} };
            try {
              const siteRes = await fetch(`${this.baseUrl}/api/fetch-site?url=${encodeURIComponent(website)}`, {
                signal: AbortSignal.timeout(15000),
              });
              if (siteRes.ok) {
                siteData = await siteRes.json();
              }
            } catch {
              console.log('[LeadCapture] Could not fetch site:', website);
            }

            const score = calculateOpportunityScore({
              website,
              email: siteData.emails?.[0],
              phone: siteData.phones?.[0],
              snippet: item.snippet,
              name: item.title,
            }, captureMetric);

            results.push({
              id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              name: item.title || hostname,
              company: item.title || hostname,
              website: website,
              email: siteData.emails?.[0] || null,
              phone: siteData.phones?.[0] || null,
              whatsapp: siteData.phones?.find(p => p.length === 11) || null,
              emails: siteData.emails || [],
              phones: siteData.phones || [],
              meta: siteData.meta || {},
              source: item.source || 'Web Search',
              snippet: item.snippet || '',
              status: 'qualified',
              isValid: true,
              isActive: true,
              location: location,
              industry: niche,
              score: score,
              estimatedValue: calculateAiDevelopmentEstimatedValue({ website, industry: niche, hasEmail: !!siteData.emails?.[0], hasPhone: !!siteData.phones?.[0] }, captureMetric),
              captureMetric: captureMetric,
              metricCategory: captureMetric,
              identifiedIssues: analyzeLeadForMetric({ website, industry: niche }, captureMetric).issues,
              conversionSignals: getLeadConversionSignals({ website, industry: niche, score }, captureMetric),
              prospectingPlan: buildProspectingPlan({ website, industry: niche, score }, captureMetric),
            });
          }
        }
      } catch (err) {
        console.error('[LeadCapture] Search query failed:', err.message);
      }
    }

    console.log('[LeadCapture] Final results:', results.length, 'leads');

    if (results.length === 0) {
      throw new Error('Nenhum lead encontrado. Verifique sua conexao ou inicio o servidor backend (npm run dev:backend).');
    }

    return results;
  }

  parseHtmlResults(html) {
    const results = [];
    if (!html) return results;

    const linkRegex = /<a[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const title = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      if (title.length > 5 && !href.includes('duckduckgo') && !href.includes('google.com/search')) {
        results.push({ title, link: href, snippet: '' });
      }

      if (results.length > 30) break;
    }

    return results;
  }

  startProgressPulse(jobId, quantity) {
    const phases = [
      { max: 15, label: 'Conectando fontes de busca' },
      { max: 35, label: 'Buscando no Google e Bing' },
      { max: 60, label: 'Validando sites encontrados' },
      { max: 80, label: 'Extraindo contatos (email/phone)' },
      { max: 92, label: 'Calculando score de oportunidade' },
    ];
    let progress = 5;
    let totalFound = 0;

    const interval = setInterval(() => {
      const phase = phases.find(p => progress < p.max) || phases[phases.length - 1];
      const increment = progress < 35 ? 4 : progress < 60 ? 3 : progress < 80 ? 2 : 1;
      progress = Math.min(92, progress + increment);
      totalFound = Math.min(quantity, totalFound + (progress > 30 ? Math.max(1, Math.round(quantity / 12)) : 0));
      this.dataProvider.updateCaptureJob(jobId, { progress, total_found: totalFound, phaseLabel: phase.label });
    }, 2000);

    return () => clearInterval(interval);
  }

  async runJob(jobId, config) {
    const { quantity } = config;
    let stopProgressPulse = () => {};

    try {
      this.dataProvider.updateCaptureJob(jobId, {
        status: 'running',
        progress: 5,
        total_found: 0,
        phaseLabel: 'Iniciando captura de leads',
      });
      stopProgressPulse = this.startProgressPulse(jobId, quantity);

      const allFound = await this.realCapture(config);
      stopProgressPulse();

      this.dataProvider.updateCaptureJob(jobId, {
        progress: 95,
        total_found: allFound.length,
        phaseLabel: 'Finalizando analise de oportunidades',
      });

      // Sort by score (highest opportunity first)
      allFound.sort((a, b) => b.score - a.score);

      this.dataProvider.addCaptureResults(jobId, allFound);
      this.dataProvider.updateCaptureJob(jobId, {
        status: 'completed',
        progress: 100,
        total_valid: allFound.length,
        total_found: allFound.length,
        phaseLabel: `${allFound.length} leads qualificados por oportunidade`,
      });
    } catch (error) {
      stopProgressPulse();
      console.error('[LeadCapture] Job failed:', error);
      this.dataProvider.updateCaptureJob(jobId, {
        status: 'failed',
        progress: 100,
        phaseLabel: 'Captura falhou',
        error: error.message,
      });
    }
  }
}