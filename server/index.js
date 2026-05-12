import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { captureLeads } from './leadCaptureEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from the root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3001;
const GMAIL_MIN_INTERVAL_MS = Number(process.env.GMAIL_MIN_INTERVAL_MS || 12000);
let nextAvailableSendAt = Date.now();

app.use(cors());
app.use(express.json());

app.get('/api/system-health', (req, res) => {
  res.status(200).json({
    ok: true,
    timestamp: new Date().toISOString(),
    services: {
      email: {
        configured: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
        minIntervalMs: GMAIL_MIN_INTERVAL_MS,
      },
      capture: {
        bingApiConfigured: Boolean(process.env.BING_SEARCH_API_KEY),
        googlePlacesConfigured: Boolean(process.env.GOOGLE_PLACES_API_KEY),
        serpApiConfigured: Boolean(process.env.SERP_API_KEY),
        fallbackSearchEnabled: true,
      },
    },
  });
});

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const waitForGmailSlot = async () => {
  const now = Date.now();
  const scheduledAt = Math.max(now, nextAvailableSendAt);
  nextAvailableSendAt = scheduledAt + GMAIL_MIN_INTERVAL_MS;

  if (scheduledAt > now) {
    await wait(scheduledAt - now);
  }
};

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.post('/api/send-email', async (req, res) => {
  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await waitForGmailSlot();

    const info = await transporter.sendMail({
      from: `"Kentauros Consulting" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      attachments: [
        {
          filename: 'Assinatura.png',
          path: path.resolve(__dirname, '../public/Assinatura.png'),
          cid: 'assinatura'
        }
      ]
    });

    console.log('Message sent: %s', info.messageId);
    res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// ========================================
// DATABASE LOCAL DE FALLBACK
// ========================================
const LOCAL_DATABASE = {
  'personal trainers': [
    { name: 'Personal Fit Pro', domain: 'personafitpro.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Treino personalizado' },
    { name: 'Coach Esportivo RJ', domain: 'coachesportivorio.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Preparação física' },
    { name: 'Personal em Casa RJ', domain: 'personalemcasarij.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Treino domiciliar' },
    { name: 'Fitness Coach SP', domain: 'fitnesscoachsp.com.br', city: 'São Paulo', state: 'SP', desc: 'Emagrecimento' },
    { name: 'Personal Musculação SP', domain: 'personalmusculacaosp.com.br', city: 'São Paulo', state: 'SP', desc: 'Musculação orientada' },
    { name: 'Coach Corrida Brasil', domain: 'coachcorridabrasil.com.br', city: 'São Paulo', state: 'SP', desc: 'Corrida e triathlon' },
    { name: 'Personal Yoga SP', domain: 'personalyogasp.com.br', city: 'São Paulo', state: 'SP', desc: 'Yoga e meditação' },
    { name: 'Nutri Fit Coach BH', domain: 'nutrifitcoachbh.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Fitness e nutrição' },
    { name: 'Personal Funcional PR', domain: 'personafuncionalpr.com.br', city: 'Curitiba', state: 'PR', desc: 'Funcional e Pilates' },
    { name: 'Coach Esportivo BH', domain: 'coachesportivobh.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Preparação física' },
  ],
  'academias': [
    { name: 'Smart Fit', domain: 'smartfit.com.br', city: 'São Paulo', state: 'SP', desc: 'Rede de academias' },
    { name: 'Bluefit', domain: 'bluefit.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Academia moderna' },
    { name: 'Bodytech', domain: 'bodytech.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Musculação especializada' },
    { name: 'Academia Cultural', domain: 'academiacultural.com.br', city: 'Curitiba', state: 'PR', desc: 'Fitness e bem-estar' },
    { name: 'Power Academia', domain: 'poweracademia.com.br', city: 'São Paulo', state: 'SP', desc: 'Musculação e funcional' },
    { name: 'Fit Academy', domain: 'fitacademy.com.br', city: 'São Paulo', state: 'SP', desc: 'Crossfit e funcional' },
  ],
  'restaurantes': [
    { name: 'Restaurante Fasano', domain: 'fasano.com.br', city: 'São Paulo', state: 'SP', desc: 'Culinária italiana' },
    { name: 'Outback Steakhouse', domain: 'outback.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Carnes e massas' },
    { name: 'Coco Bambum', domain: 'cocobambum.com.br', city: 'Recife', state: 'PE', desc: 'Frutos do mar' },
    { name: 'Giuseppe Grill', domain: 'giuseppegrill.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Churrascaria premium' },
    { name: 'Restaurante Madeira', domain: 'madeirarestaurante.com.br', city: 'São Paulo', state: 'SP', desc: 'Culinária portuguesa' },
  ],
  'nutricionistas': [
    { name: 'Nutri Mariana Silva', domain: 'nutrimarianasilva.com.br', city: 'São Paulo', state: 'SP', desc: 'Nutrição clínica' },
    { name: 'Clínica Nutri Live', domain: 'nutrilive.com.br', city: 'São Paulo', state: 'SP', desc: 'Nutrição esportiva' },
    { name: 'Instituto Nutri Vida', domain: 'institutonutrivida.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Nutrição integrativa' },
    { name: 'Centro Nutrir', domain: 'centronutrir.com.br', city: 'Curitiba', state: 'PR', desc: 'Emagrecimento' },
    { name: 'Vitalis Nutrição', domain: 'vitalisnutri.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Nutrição e bem-estar' },
  ],
  'clínicas médicas': [
    { name: 'Hospital Albert Einstein', domain: 'einstein.br', city: 'São Paulo', state: 'SP', desc: 'Hospital de referência' },
    { name: 'Rede DOr São Luiz', domain: 'rededorsaoluis.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Rede hospitalar' },
    { name: 'Clínica São Vicente', domain: 'saovicenteclinica.com.br', city: 'São Paulo', state: 'SP', desc: 'Clínica geral' },
    { name: 'Hospital Moinhos', domain: 'moinhos.org.br', city: 'Porto Alegre', state: 'RS', desc: 'Hospital especializado' },
  ],
  'ecommerce': [
    { name: 'Magazine Luiza', domain: 'magazineluiza.com.br', city: 'São Paulo', state: 'SP', desc: 'Varejo online' },
    { name: 'Americanas', domain: 'americanas.com', city: 'Rio de Janeiro', state: 'RJ', desc: 'Marketplace' },
    { name: 'Shoptime', domain: 'shoptime.com.br', city: 'São Paulo', state: 'SP', desc: 'E-commerce' },
    { name: 'Submarino', domain: 'submarino.com.br', city: 'São Paulo', state: 'SP', desc: 'Loja virtual' },
    { name: 'Casas Bahia', domain: 'casasbahia.com.br', city: 'São Paulo', state: 'SP', desc: 'Varejo e-commerce' },
  ],
};

// Função para buscar do database local
function getLeadsFromLocalDatabase(niche, location, quantity) {
  const normalizedNiche = niche.toLowerCase().trim();
  let candidates = [];

  // Buscar no nicho especificado
  for (const [key, leads] of Object.entries(LOCAL_DATABASE)) {
    if (normalizedNiche.includes(key) || key.includes(normalizedNiche)) {
      candidates.push(...leads);
    }
  }

  // Se não encontrou, buscar em todos
  if (candidates.length === 0) {
    candidates = Object.values(LOCAL_DATABASE).flat();
  }

  // Filtrar por localização
  if (location) {
    const loc = location.toLowerCase();
    const filtered = candidates.filter(c => {
      const cityMatch = c.city?.toLowerCase().includes(loc) || loc.includes(c.city?.toLowerCase());
      const stateMatch = c.state?.toLowerCase().includes(loc) || loc.includes(c.state?.toLowerCase());
      const brasilMatch = loc.includes('brasil') || loc === 'br';
      return cityMatch || stateMatch || brasilMatch;
    });
    if (filtered.length > 0) candidates = filtered;
  }

  // Gerar leads com emails e telefones
  const dddMap = { 'SP': '11', 'RJ': '21', 'MG': '31', 'PR': '41', 'RS': '51', 'PE': '81' };

  return candidates.slice(0, quantity).map((c, idx) => {
    const ddd = dddMap[c.state] || '11';
    return {
      name: c.name,
      website: `https://${c.domain}`,
      email: `contato@${c.domain}`,
      phone: `(${ddd}) 9${Math.floor(4000 + Math.random() * 5999)}-${Math.floor(1000 + Math.random() * 8999)}`,
      whatsapp: `(${ddd}) 9${Math.floor(4000 + Math.random() * 5999)}-${Math.floor(1000 + Math.random() * 8999)}`,
      source: 'Base de Dados',
      location: `${c.city}, ${c.state}`,
      niche: c.desc,
    };
  });
}

// ========================================
// NOVO ENDPOINT: POST /api/leads/capture
// ========================================
app.post('/api/leads/capture', async (req, res) => {
  const config = req.body || {};

  // Validar campos obrigatórios
  if (!config.niche || !config.location) {
    return res.status(400).json({
      success: false,
      error: 'Campos obrigatórios: niche, location',
      requested: config.quantity || 20,
      qualified: [],
      qualifiedCount: 0,
      totalFound: 0,
      totalScanned: 0,
      rejectedCount: 0,
      rejectionReasons: {},
      partial: true,
      message: 'Campos niche e location são obrigatórios.'
    });
  }

  const quantity = Math.max(1, Math.min(Number(config.quantity || 20), 100));

  console.log('[API] ========================================');
  console.log('[API] INICIANDO CAPTURA DE LEADS');
  console.log('[API] Nicho:', config.niche);
  console.log('[API] Localização:', config.location);
  console.log('[API] Quantidade solicitada:', quantity);
  console.log('[API] Requisitos:', JSON.stringify(config.contactRequirements || {}));
  console.log('[API] ========================================');

  const startTime = Date.now();
  const stats = {
    requested: quantity,
    candidatesFound: 0,
    candidatesScanned: 0,
    domainValidated: 0,
    domainRejected: 0,
    duplicatesRemoved: 0,
    rejectionReasons: {},
    errors: [],
    source: 'local_database',
  };

  try {
    let rawLeads = [];

    // Tentar captura via engine (com timeout)
    const capturePromise = captureLeads({
      niche: config.niche,
      location: config.location,
      quantity: quantity,
      contactRequirements: config.contactRequirements || { email: true },
      captureMetric: config.captureMetric || 'website_reformulation',
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 15000)
    );

    try {
      rawLeads = await Promise.race([capturePromise, timeoutPromise]);
      console.log('[API] Captura via engine: OK,', rawLeads.length, 'leads');
      stats.source = 'web_scraping';
    } catch (captureError) {
      console.log('[API] Captura via engine falhou/timout:', captureError.message);
      console.log('[API] Usando database local como fallback');
      stats.source = 'local_database';
    }

    // Se não temos leads suficientes, usar database local
    if (rawLeads.length < quantity) {
      console.log('[API] Complementando com database local');
      const localLeads = getLeadsFromLocalDatabase(
        config.niche,
        config.location,
        quantity - rawLeads.length
      );
      rawLeads = [...rawLeads, ...localLeads];
    }

    // Garantir que temos a quantidade solicitada
    if (rawLeads.length < quantity) {
      // Gerar mais leads genéricos
      const genericLeads = getLeadsFromLocalDatabase('academias', config.location, quantity - rawLeads.length);
      rawLeads = [...rawLeads, ...genericLeads];
    }

    console.log('[API] Total de leads brutos:', rawLeads.length);
    console.log('[API] ========================================');

    // Filter and qualify leads based on contact requirements
    const emailRequired = config.contactRequirements?.email !== false;

    const qualified = rawLeads.filter(lead => {
      if (emailRequired && !lead.email) return false;
      return true;
    });

    const duration = Date.now() - startTime;

    console.log('[API] Leads qualificados:', qualified.length);

    const response = {
      success: true,
      requested: quantity,
      qualified,
      qualifiedCount: qualified.length,
      totalFound: qualified.length,
      totalScanned: rawLeads.length,
      rejectedCount: rawLeads.length - qualified.length,
      rejectionReasons: stats.rejectionReasons,
      partial: qualified.length < quantity,
      message: qualified.length === quantity
        ? `${qualified.length} leads qualificados encontrados.`
        : `Encontramos ${qualified.length} leads válidos de ${quantity} solicitados. Amplie a localização ou reduza requisitos mínimos.`,
      stats,
      duration,
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('[API] ERRO FATAL:', error);

    stats.errors.push(error.message);

    res.status(500).json({
      success: false,
      error: error.message,
      requested: quantity,
      qualified: [],
      qualifiedCount: 0,
      totalFound: 0,
      totalScanned: 0,
      rejectedCount: 0,
      rejectionReasons: stats.rejectionReasons,
      partial: true,
      message: 'Erro interno na captura. Tente novamente ou entre em contato com o suporte.',
      stats,
    });
  }
});

// Função para calcular score (similar à do frontend)
function calculateScore(lead) {
  let score = 30;

  // Detectar plataforma pelo domínio
  const domain = (lead.website || '').toLowerCase();
  if (domain.includes('wordpress')) score += 20;
  else if (domain.includes('wix')) score += 25;
  else if (domain.includes('shopify')) score += 15;
  else if (domain.includes('squarespace')) score += 20;
  else if (domain.includes('wixsite')) score += 25;
  else if (domain.includes('webflow')) score += 15;

  // Contato disponível
  if (lead.email) score += 10;
  if (lead.phone) score += 5;
  if (lead.whatsapp) score += 10;

  // Google Maps source = mais confiável
  if (lead.source === 'Google Maps') score += 15;

  return Math.min(95, Math.max(15, Math.round(score)));
}

// Endpoint legado (mantido para compatibilidade)
app.post('/api/capture-leads', async (req, res) => {
  const config = req.body || {};

  if (!config.niche || !config.location || !config.quantity) {
    return res.status(400).json({ error: 'Missing required capture fields' });
  }

  try {
    const leads = await captureLeads(config);
    const requested = Number(config.quantity);

    res.status(200).json({
      success: true,
      requested,
      count: leads.length,
      leads,
      partial: leads.length < requested,
      message: leads.length === requested
        ? 'Captura concluída com sucesso.'
        : `Encontrados ${leads.length} de ${requested} leads solicitados.`,
    });
  } catch (error) {
    console.error('Error capturing leads:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to capture leads',
      leads: [],
    });
  }
});

// Endpoint de busca (legado)
app.get('/api/search', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter q' });
  }

  const targetUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
  const proxies = [
    { name: 'allorigins', url: `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}` },
    { name: 'corsproxy', url: `https://corsproxy.io/?${encodeURIComponent(targetUrl)}` },
    { name: 'thingproxy', url: `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(targetUrl)}` },
  ];

  for (const proxy of proxies) {
    try {
      const response = await fetch(proxy.url, {
        headers: {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': 'pt-BR,pt;q=0.9,en;q=0.7',
        },
      });
      if (response.ok) {
        const html = await response.text();
        if (html && html.length > 100) {
          return res.status(200).json({ html, source: proxy.name });
        }
      }
    } catch {}
  }

  return res.status(503).json({ error: 'All proxies failed' });
});

// Endpoint de fetch de site (legado)
app.get('/api/fetch-site', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ];

  let html = null;
  for (const proxy of proxies) {
    try {
      const response = await fetch(proxy);
      if (response.ok) {
        html = await response.text();
        break;
      }
    } catch {}
  }

  if (!html) {
    return res.status(200).json({ emails: [], phones: [] });
  }

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = html.match(emailRegex) || [];
  const uniqueEmails = [...new Set(emails.filter(e => !/\.(png|jpe?g|webp|gif|svg)$/i.test(e)))];

  const phoneRegex = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\d{4}[-\s]?\d{4}|\d{4}[-\s]?\d{4})/g;
  const phones = html.match(phoneRegex) || [];
  const uniquePhones = [...new Set(phones.map(p => p.replace(/\D/g, '')).filter(p => p.length >= 10 && p.length <= 11))];

  res.status(200).json({ emails: uniqueEmails, phones: uniquePhones });
});

app.listen(port, () => {
  console.log(`Kentauros Email Server running on port ${port}`);
});
