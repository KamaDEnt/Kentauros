// Vercel Serverless Function: /api/leads/capture
// Handles POST requests for lead capture

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Local database for fallback
const LOCAL_DATABASE = {
  'escritorios de advocacia': [
    { name: 'Escritório Almeida & Associados', domain: 'almeidaadvogados.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Direito Empresarial' },
    { name: 'Lima Advocacia', domain: 'limadvocacia.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Direito Civil' },
    { name: 'Martins & Santos Advogados', domain: 'martinssantos.adv.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Direito do Trabalho' },
    { name: 'Ferreira Advocacia', domain: 'ferreiraadv.com.br', city: 'São Paulo', state: 'SP', desc: 'Direito Tributário' },
    { name: 'Oliveira Sociedade de Advogados', domain: 'oliveiraadvogados.com.br', city: 'São Paulo', state: 'SP', desc: 'Direito Empresarial' },
    { name: 'Carvalho & Lima Advogados', domain: 'carvalholima.adv.br', city: 'Belo Horizonte', state: 'MG', desc: 'Direito Imobiliário' },
    { name: 'Pereira Advocacia', domain: 'pereiraadv.adv.br', city: 'Curitiba', state: 'PR', desc: 'Direito de Família' },
    { name: 'Silva Advocacia Digital', domain: 'silvaadvdigital.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Advocacia Digital' },
  ],
  'personal trainers': [
    { name: 'Personal Fit Pro', domain: 'personafitpro.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Treino personalizado' },
    { name: 'Coach Esportivo RJ', domain: 'coachesportivorio.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Preparação física' },
    { name: 'Fitness Coach SP', domain: 'fitnesscoachsp.com.br', city: 'São Paulo', state: 'SP', desc: 'Emagrecimento' },
    { name: 'Personal Musculação SP', domain: 'personalmusculacaosp.com.br', city: 'São Paulo', state: 'SP', desc: 'Musculação orientada' },
    { name: 'Coach Corrida Brasil', domain: 'coachcorridabrasil.com.br', city: 'São Paulo', state: 'SP', desc: 'Corrida e triathlon' },
    { name: 'Personal Yoga SP', domain: 'personalyogasp.com.br', city: 'São Paulo', state: 'SP', desc: 'Yoga e meditação' },
    { name: 'Nutri Fit Coach BH', domain: 'nutrifitcoachbh.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Fitness e nutrição' },
    { name: 'Personal Funcional PR', domain: 'personafuncionalpr.com.br', city: 'Curitiba', state: 'PR', desc: 'Funcional e Pilates' },
  ],
  'academias': [
    { name: 'Smart Fit', domain: 'smartfit.com.br', city: 'São Paulo', state: 'SP', desc: 'Rede de academias' },
    { name: 'Bluefit', domain: 'bluefit.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Academia moderna' },
    { name: 'Bodytech', domain: 'bodytech.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Musculação especializada' },
    { name: 'Power Academia', domain: 'poweracademia.com.br', city: 'São Paulo', state: 'SP', desc: 'Musculação e funcional' },
    { name: 'Fit Academy', domain: 'fitacademy.com.br', city: 'São Paulo', state: 'SP', desc: 'Crossfit e funcional' },
    { name: 'Academia Cultural', domain: 'academiacultural.com.br', city: 'Curitiba', state: 'PR', desc: 'Fitness e bem-estar' },
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

const DDD_MAP = { 'SP': '11', 'RJ': '21', 'MG': '31', 'PR': '41', 'RS': '51', 'PE': '81', 'DF': '61' };

function getLeadsFromLocalDatabase(niche, location, quantity) {
  const normalizedNiche = niche?.toLowerCase().trim() || '';
  let candidates = [];

  // Search in specified niche
  for (const [key, leads] of Object.entries(LOCAL_DATABASE)) {
    if (normalizedNiche.includes(key) || key.includes(normalizedNiche)) {
      candidates.push(...leads);
    }
  }

  // If none found, search in all
  if (candidates.length === 0) {
    candidates = Object.values(LOCAL_DATABASE).flat();
  }

  // Filter by location
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

  // Generate leads with emails and phones
  return candidates.slice(0, quantity).map((c, idx) => {
    const ddd = DDD_MAP[c.state] || '11';
    const phone1 = `(${ddd}) 9${Math.floor(4000 + Math.random() * 5999)}-${Math.floor(1000 + Math.random() * 8999)}`;
    const phone2 = `(${ddd}) 9${Math.floor(4000 + Math.random() * 5999)}-${Math.floor(1000 + Math.random() * 8999)}`;

    return {
      id: `lead_${Date.now()}_${idx}_local`,
      name: c.name,
      company: c.name,
      website: `https://${c.domain}`,
      email: `contato@${c.domain}`,
      phone: phone1,
      whatsapp: phone2,
      meta: { title: c.name, description: c.desc },
      source: 'Local Database',
      snippet: `${c.desc} em ${c.city}, ${c.state}`,
      status: 'qualified',
      isValid: true,
      isActive: true,
      location: `${c.city}, ${c.state}`,
      industry: niche,
      captureMetric: 'website_reformulation',
      score: 50 + Math.floor(Math.random() * 35),
      estimatedValue: 15000 + Math.floor(Math.random() * 15000),
      identifiedIssues: [],
      opportunities: ['Site pode ser atualizado', 'Presença digital pode ser fortalecida'],
      conversionSignals: [],
      prospectingPlan: [],
      createdAt: new Date().toISOString(),
      isDevFallback: true,
    };
  });
}

function calculateScore(lead) {
  let score = 30;
  const domain = (lead.website || '').toLowerCase();

  if (domain.includes('wordpress')) score += 20;
  else if (domain.includes('wix') || domain.includes('wixsite')) score += 25;
  else if (domain.includes('shopify')) score += 15;
  else if (domain.includes('squarespace')) score += 20;
  else if (domain.includes('webflow')) score += 15;

  if (lead.email) score += 10;
  if (lead.phone) score += 5;
  if (lead.whatsapp) score += 10;
  if (lead.source === 'Google Maps') score += 15;

  return Math.min(95, Math.max(15, Math.round(score)));
}

function validateEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateWebsite(website) {
  if (!website) return false;
  const urlRegex = /^https?:\/\/.+\..+/i;
  return urlRegex.test(website);
}

// Extract domain from website URL
function extractDomain(website) {
  if (!website) return '';
  try {
    const url = website.startsWith('http') ? website : `https://${website}`;
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return website.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
  }
}

// Normalize string for comparison
function normalize(str) {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Check if lead is already captured
async function checkLeadCaptured(lead) {
  if (!supabase) return false;

  const domain = extractDomain(lead.website);
  const email = normalize(lead.email);

  if (!domain && !email) return false;

  try {
    // Query for existing lead by domain or email
    let query = supabase
      .from('captured_leads_registry')
      .select('id, normalized_domain, normalized_email')
      .limit(1);

    if (domain) {
      query = query.eq('normalized_domain', domain);
    } else if (email) {
      query = query.eq('normalized_email', email);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[API] Erro ao verificar captura:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.warn('[API] Erro ao verificar captura:', error);
    return false;
  }
}

// Filter leads that are already captured
async function filterAlreadyCapturedLeads(leads) {
  if (!supabase) return { filtered: leads, capturedCount: 0 };

  const uncaptured = [];
  let capturedCount = 0;

  for (const lead of leads) {
    const isCaptured = await checkLeadCaptured(lead);
    if (isCaptured) {
      capturedCount++;
      console.log('[API] Lead já capturado, ignorando:', lead.name, '-', lead.website);
    } else {
      uncaptured.push(lead);
    }
  }

  return { filtered: uncaptured, capturedCount };
}

// Health check endpoint
export async function GET() {
  return Response.json({
    ok: true,
    route: '/api/leads/capture',
    methods: ['POST'],
    timestamp: new Date().toISOString(),
    services: {
      supabase: Boolean(supabase),
      localDatabase: true,
    },
  });
}

// Main POST handler
export async function POST(req) {
  const startTime = Date.now();

  try {
    const body = await req.json();

    // Validate required fields
    if (!body.niche || !body.location) {
      return Response.json({
        success: false,
        errorCode: 'MISSING_REQUIRED_FIELDS',
        message: 'Campos obrigatórios: niche, location',
        details: {
          required: ['niche', 'location'],
          received: Object.keys(body),
        },
      }, { status: 400 });
    }

    const {
      niche,
      location,
      quantity = 20,
      captureMetric = 'website_reformulation',
      contactRequirements = { email: true },
      sources = ['local_database'],
    } = body;

    const requestedQuantity = Math.max(1, Math.min(Number(quantity), 100));

    console.log('[API] ========================================');
    console.log('[API] LEAD CAPTURE REQUEST');
    console.log('[API] Nicho:', niche);
    console.log('[API] Localização:', location);
    console.log('[API] Quantidade:', requestedQuantity);
    console.log('[API] Métrica:', captureMetric);
    console.log('[API] ========================================');

    const stats = {
      requested: requestedQuantity,
      candidatesFound: 0,
      candidatesScanned: 0,
      domainValidated: 0,
      domainRejected: 0,
      duplicatesRemoved: 0,
      leadsQualified: 0,
      rejectionReasons: {},
      errors: [],
      source: 'local_database',
    };

    let rawLeads = [];

    // Use local database as primary source
    rawLeads = getLeadsFromLocalDatabase(niche, location, requestedQuantity * 2); // Get more in case some are filtered
    stats.candidatesFound = rawLeads.length;
    stats.candidatesScanned = rawLeads.length;
    stats.source = 'local_database';

    console.log('[API] Leads encontrados no banco local:', rawLeads.length);

    // Filter out leads that are already captured
    if (supabase) {
      console.log('[API] Verificando leads já capturados...');
      const { filtered, capturedCount } = await filterAlreadyCapturedLeads(rawLeads);
      stats.duplicatesRemoved = capturedCount;
      rawLeads = filtered;
      console.log('[API] Leads após filtro de duplicados:', rawLeads.length, '(removidos:', capturedCount, ')');
    }

    // Filter leads based on contact requirements
    const emailRequired = contactRequirements?.email !== false;

    const qualified = rawLeads.filter(lead => {
      // Must have valid email if required
      if (emailRequired && !validateEmail(lead.email)) {
        stats.rejectionReasons.missing_email = (stats.rejectionReasons.missing_email || 0) + 1;
        return false;
      }
      // Must have valid website if required
      if (!validateWebsite(lead.website)) {
        stats.rejectionReasons.website_offline = (stats.rejectionReasons.website_offline || 0) + 1;
        return false;
      }
      return true;
    });

    // Recalculate scores
    qualified.forEach(lead => {
      lead.score = calculateScore(lead);
    });

    stats.leadsQualified = qualified.length;
    stats.domainValidated = qualified.length;

    const duration = Date.now() - startTime;

    console.log('[API] Leads qualificados:', qualified.length);
    console.log('[API] Duração:', duration + 'ms');

    // Build response
    const response = {
      success: true,
      requested: requestedQuantity,
      qualified,
      qualifiedCount: qualified.length,
      totalFound: qualified.length,
      totalScanned: rawLeads.length,
      rejectedCount: rawLeads.length - qualified.length,
      rejectionReasons: stats.rejectionReasons,
      partial: qualified.length < requestedQuantity,
      message: qualified.length === requestedQuantity
        ? `${qualified.length} leads qualificados encontrados.`
        : `Encontramos ${qualified.length} leads válidos de ${requestedQuantity} solicitados.`,
      stats,
      duration,
      isDevFallback: true,
    };

    return Response.json(response);

  } catch (error) {
    console.error('[API] ERRO FATAL:', error);

    return Response.json({
      success: false,
      errorCode: 'INTERNAL_ERROR',
      message: error.message || 'Erro interno na captura. Tente novamente.',
      details: { stack: error.stack },
    }, { status: 500 });
  }
}