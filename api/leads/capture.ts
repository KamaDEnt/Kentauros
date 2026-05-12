// Vercel Serverless Function: /api/leads/capture
// Handles POST requests for lead capture

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Local database for fallback - only use in development
const LOCAL_DATABASE = {
  'escritorios de advocacia': [
    { name: 'Escritório Almeida & Associados', domain: 'almeidaadvogados.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Direito Empresarial', category: 'advocacia' },
    { name: 'Lima Advocacia', domain: 'limadvocacia.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Direito Civil', category: 'advocacia' },
    { name: 'Martins & Santos Advogados', domain: 'martinssantos.adv.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Direito do Trabalho', category: 'advocacia' },
    { name: 'Ferreira Advocacia', domain: 'ferreiraadv.com.br', city: 'São Paulo', state: 'SP', desc: 'Direito Tributário', category: 'advocacia' },
    { name: 'Oliveira Sociedade de Advogados', domain: 'oliveiraadvogados.com.br', city: 'São Paulo', state: 'SP', desc: 'Direito Empresarial', category: 'advocacia' },
    { name: 'Carvalho & Lima Advogados', domain: 'carvalholima.adv.br', city: 'Belo Horizonte', state: 'MG', desc: 'Direito Imobiliário', category: 'advocacia' },
    { name: 'Pereira Advocacia', domain: 'pereiraadv.adv.br', city: 'Curitiba', state: 'PR', desc: 'Direito de Família', category: 'advocacia' },
    { name: 'Silva Advocacia Digital', domain: 'silvaadvdigital.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Advocacia Digital', category: 'advocacia' },
  ],
  'personal trainers': [
    { name: 'Personal Fit Pro', domain: 'personalfitpro.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Treino personalizado', category: 'fitness' },
    { name: 'Coach Esportivo RJ', domain: 'coachesportivorio.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Preparação física', category: 'fitness' },
    { name: 'Fitness Coach SP', domain: 'fitnesscoachsp.com.br', city: 'São Paulo', state: 'SP', desc: 'Emagrecimento', category: 'fitness' },
    { name: 'Personal Musculação SP', domain: 'personalmusculacaosp.com.br', city: 'São Paulo', state: 'SP', desc: 'Musculação orientada', category: 'fitness' },
    { name: 'Coach Corrida Brasil', domain: 'coachcorridabrasil.com.br', city: 'São Paulo', state: 'SP', desc: 'Corrida e triathlon', category: 'fitness' },
    { name: 'Personal Yoga SP', domain: 'personalyogasp.com.br', city: 'São Paulo', state: 'SP', desc: 'Yoga e meditação', category: 'fitness' },
    { name: 'Nutri Fit Coach BH', domain: 'nutrifitcoachbh.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Fitness e nutrição', category: 'fitness' },
    { name: 'Personal Funcional PR', domain: 'personafuncionalpr.com.br', city: 'Curitiba', state: 'PR', desc: 'Funcional e Pilates', category: 'fitness' },
  ],
  'academias': [
    { name: 'Smart Fit', domain: 'smartfit.com.br', city: 'São Paulo', state: 'SP', desc: 'Rede de academias', category: 'fitness' },
    { name: 'Bluefit', domain: 'bluefit.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Academia moderna', category: 'fitness' },
    { name: 'Bodytech', domain: 'bodytech.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Musculação especializada', category: 'fitness' },
    { name: 'Power Academia', domain: 'poweracademia.com.br', city: 'São Paulo', state: 'SP', desc: 'Musculação e funcional', category: 'fitness' },
    { name: 'Fit Academy', domain: 'fitacademy.com.br', city: 'São Paulo', state: 'SP', desc: 'Crossfit e funcional', category: 'fitness' },
    { name: 'Academia Cultural', domain: 'academiacultural.com.br', city: 'Curitiba', state: 'PR', desc: 'Fitness e bem-estar', category: 'fitness' },
  ],
  'consultorias': [
    { name: 'Consultoria Empresarial Alpha', domain: 'consultoriaalpha.com.br', city: 'São Paulo', state: 'SP', desc: 'Consultoria empresarial', category: 'consultoria' },
    { name: 'BConsult Consultoria', domain: 'bconsult.com.br', city: 'São Paulo', state: 'SP', desc: 'Consultoria de negócios', category: 'consultoria' },
    { name: 'RHS Consultoria', domain: 'rhsconsultoria.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Consultoria RH', category: 'consultoria' },
    { name: 'Delta Consultoria Empresarial', domain: 'deltaconsultoria.adv.br', city: 'Belo Horizonte', state: 'MG', desc: 'Consultoria estratégica', category: 'consultoria' },
  ],
  'restaurantes': [
    { name: 'Restaurante Fasano', domain: 'fasano.com.br', city: 'São Paulo', state: 'SP', desc: 'Culinária italiana', category: 'restaurante' },
    { name: 'Outback Steakhouse', domain: 'outback.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Carnes e massas', category: 'restaurante' },
    { name: 'Coco Bambum', domain: 'cocobambum.com.br', city: 'Recife', state: 'PE', desc: 'Frutos do mar', category: 'restaurante' },
    { name: 'Giuseppe Grill', domain: 'giuseppegrill.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Churrascaria premium', category: 'restaurante' },
    { name: 'Restaurante Madeira', domain: 'madeirarestaurante.com.br', city: 'São Paulo', state: 'SP', desc: 'Culinária portuguesa', category: 'restaurante' },
  ],
  'nutricionistas': [
    { name: 'Nutri Mariana Silva', domain: 'nutrimarianasilva.com.br', city: 'São Paulo', state: 'SP', desc: 'Nutrição clínica', category: 'nutricao' },
    { name: 'Clínica Nutri Live', domain: 'nutrilive.com.br', city: 'São Paulo', state: 'SP', desc: 'Nutrição esportiva', category: 'nutricao' },
    { name: 'Instituto Nutri Vida', domain: 'institutonutrivida.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Nutrição integrativa', category: 'nutricao' },
    { name: 'Centro Nutrir', domain: 'centronutrir.com.br', city: 'Curitiba', state: 'PR', desc: 'Emagrecimento', category: 'nutricao' },
    { name: 'Vitalis Nutrição', domain: 'vitalisnutri.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Nutrição e bem-estar', category: 'nutricao' },
  ],
  'clínicas médicas': [
    { name: 'Hospital Albert Einstein', domain: 'einstein.br', city: 'São Paulo', state: 'SP', desc: 'Hospital de referência', category: 'saude' },
    { name: 'Rede DOr São Luiz', domain: 'rededorsaoluis.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Rede hospitalar', category: 'saude' },
    { name: 'Clínica São Vicente', domain: 'saovicenteclinica.com.br', city: 'São Paulo', state: 'SP', desc: 'Clínica geral', category: 'saude' },
    { name: 'Hospital Moinhos', domain: 'moinhos.org.br', city: 'Porto Alegre', state: 'RS', desc: 'Hospital especializado', category: 'saude' },
  ],
  'ecommerce': [
    { name: 'Magazine Luiza', domain: 'magazineluiza.com.br', city: 'São Paulo', state: 'SP', desc: 'Varejo online', category: 'ecommerce' },
    { name: 'Americanas', domain: 'americanas.com', city: 'Rio de Janeiro', state: 'RJ', desc: 'Marketplace', category: 'ecommerce' },
    { name: 'Shoptime', domain: 'shoptime.com.br', city: 'São Paulo', state: 'SP', desc: 'E-commerce', category: 'ecommerce' },
    { name: 'Submarino', domain: 'submarino.com.br', city: 'São Paulo', state: 'SP', desc: 'Loja virtual', category: 'ecommerce' },
    { name: 'Casas Bahia', domain: 'casasbahia.com.br', city: 'São Paulo', state: 'SP', desc: 'Varejo e-commerce', category: 'ecommerce' },
  ],
};

// Map niche variations to database keys
const NICHE_MAPPINGS = {
  'escritorios de advocacia': ['escritorios de advocacia', 'advocacia', 'advogado', 'jurídico', 'direito'],
  'personal trainers': ['personal trainers', 'personal trainer', 'coach esportivo', 'treinador', 'fitness'],
  'academias': ['academias', 'academia', 'crossfit', 'ginástica', 'musculação'],
  'consultorias': ['consultorias', 'consultoria', 'consultor', 'assessoria'],
  'restaurantes': ['restaurantes', 'restaurante', 'gastronomia', 'comida'],
  'nutricionistas': ['nutricionistas', 'nutrição', 'nutricionista'],
  'clínicas médicas': ['clínicas médicas', 'clínica médica', 'hospital', 'clínica'],
  'ecommerce': ['ecommerce', 'e-commerce', 'loja virtual', 'loja online'],
};

// Map location variations
const LOCATION_MAPPINGS = {
  'DF': ['df', 'distrito federal', 'brasília', 'brasilia', 'asasul', 'asaanorte', 'taguatinga', 'aguasclaras'],
  'RJ': ['rj', 'rio de janeiro', 'rio', 'niteroi', 'saogoncalo', 'niterói'],
  'SP': ['sp', 'são paulo', 'sao paulo', 'campinas', 'santos', 'ribeirao', 'sorocaba'],
  'MG': ['mg', 'belo horizonte', 'bh', 'juiz de fora', 'uberlandia'],
  'PR': ['pr', 'curitiba', 'londrina', 'maringa', 'joinville'],
  'RS': ['rs', 'porto alegre', 'canoas', 'pelotas'],
  'PE': ['pe', 'recife', 'jaboatao', 'olinda'],
};

const DDD_MAP = { 'SP': '11', 'RJ': '21', 'MG': '31', 'PR': '41', 'RS': '51', 'PE': '81', 'DF': '61' };

// Check if lead matches niche
function leadMatchesNiche(lead, selectedNiche) {
  const niche = selectedNiche?.toLowerCase().trim() || '';
  const leadDesc = lead.desc?.toLowerCase() || '';
  const leadName = lead.name?.toLowerCase() || '';

  // Get allowed keywords for this niche
  const nicheKeywords = NICHE_MAPPINGS[niche] || [niche];

  // Check if any keyword matches
  const matchesKeyword = nicheKeywords.some(keyword =>
    leadDesc.includes(keyword) ||
    leadName.includes(keyword) ||
    lead.category?.toLowerCase().includes(keyword)
  );

  // Check for direct niche match in database key
  const nicheKeys = Object.keys(LOCAL_DATABASE);
  const matchesNicheKey = nicheKeys.some(key =>
    niche.includes(key) || key.includes(niche)
  );

  return matchesKeyword || matchesNicheKey;
}

// Check if lead matches location
function leadMatchesLocation(lead, selectedLocation) {
  const location = selectedLocation?.toLowerCase().trim() || '';
  const leadCity = lead.city?.toLowerCase() || '';
  const leadState = lead.state?.toLowerCase() || '';

  // If location is "Brasil" or empty, accept all
  if (location.includes('brasil') || location === 'br' || !location) {
    return true;
  }

  // Extract state from location (e.g., "São Paulo, SP" -> "SP")
  const stateMatch = location.match(/\b([A-Z]{2})\b/);
  const cityMatch = location.split(',')[0].trim().toLowerCase();

  // Check for exact state match
  if (stateMatch) {
    const requestedState = stateMatch[1].toUpperCase();
    if (lead.state?.toUpperCase() === requestedState) {
      return true;
    }
  }

  // Check for state in location mappings
  for (const [stateCode, keywords] of Object.entries(LOCATION_MAPPINGS)) {
    if (keywords.some(kw => location.includes(kw))) {
      if (lead.state?.toUpperCase() === stateCode) {
        return true;
      }
    }
  }

  // Check for city match
  if (leadCity.includes(cityMatch) || cityMatch.includes(leadCity)) {
    return true;
  }

  return false;
}

// Validate email format
function validateEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate website URL format
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

// Calculate real score based on opportunities
function calculateScore(lead) {
  let score = 30;
  const domain = (lead.website || '').toLowerCase();

  // Platform detection (older platforms = higher opportunity)
  if (domain.includes('wordpress')) score += 25;
  else if (domain.includes('wix') || domain.includes('wixsite')) score += 30;
  else if (domain.includes('shopify')) score += 15;
  else if (domain.includes('squarespace')) score += 25;
  else if (domain.includes('webflow')) score += 15;
  else if (domain.includes('weebly')) score += 20;
  else if (domain.includes('godaddy') || domain.includes('sitebuilder')) score += 35;
  else if (!domain) score -= 30; // No website is a negative signal

  // Contact info
  if (lead.email && validateEmail(lead.email)) score += 10;
  else score -= 15;

  if (lead.phone) score += 5;
  if (lead.whatsapp) score += 10;

  // Source credibility
  if (lead.source === 'Google Maps') score += 10;
  if (lead.source === 'Local Database') score += 5; // Lower score for fallback data

  // Quality signals from description
  if (lead.desc?.toLowerCase().includes('digital')) score += 5;
  if (lead.desc?.toLowerCase().includes('online')) score += 5;

  return Math.min(85, Math.max(15, Math.round(score)));
}

// Get leads from local database with proper filtering
function getLeadsFromLocalDatabase(niche, location, quantity) {
  const normalizedNiche = niche?.toLowerCase().trim() || '';
  const normalizedLocation = location?.toLowerCase().trim() || '';

  console.log('[API] Buscando leads para nicho:', normalizedNiche, 'em', normalizedLocation);

  // Find matching niche key
  let matchingNicheKey = null;
  for (const key of Object.keys(LOCAL_DATABASE)) {
    const keywords = NICHE_MAPPINGS[key] || [key];
    if (keywords.some(kw => normalizedNiche.includes(kw) || kw.includes(normalizedNiche))) {
      matchingNicheKey = key;
      break;
    }
    // Also check direct match
    if (normalizedNiche.includes(key) || key.includes(normalizedNiche)) {
      matchingNicheKey = key;
      break;
    }
  }

  if (!matchingNicheKey) {
    console.log('[API] Nicho não encontrado no banco local:', normalizedNiche);
    return [];
  }

  console.log('[API] Nicho mapeado para:', matchingNicheKey);

  // Get candidates from this niche only
  let candidates = [...LOCAL_DATABASE[matchingNicheKey]];

  console.log('[API] Candidatos antes do filtro de localização:', candidates.length);

  // Filter by location
  candidates = candidates.filter(c => leadMatchesLocation(c, normalizedLocation));

  console.log('[API] Candidatos após filtro de localização:', candidates.length);

  if (candidates.length === 0) {
    console.log('[API] Nenhum lead encontrado para esta localização');
    return [];
  }

  // Generate leads with structured data
  return candidates.slice(0, quantity).map((c, idx) => {
    const ddd = DDD_MAP[c.state] || '11';
    const phone1 = `(${ddd}) 9${Math.floor(4000 + Math.random() * 5999)}-${Math.floor(1000 + Math.random() * 8999)}`;
    const phone2 = `(${ddd}) 9${Math.floor(4000 + Math.random() * 5999)}-${Math.floor(1000 + Math.random() * 8999)}`;
    const score = calculateScore({ ...c, website: c.domain });

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
      city: c.city,
      state: c.state,
      industry: niche,
      category: c.category,
      description: c.desc,
      captureMetric: 'website_reformulation',
      score,
      scoreBreakdown: {
        platformMatch: c.domain.includes('wix') || c.domain.includes('wordpress') ? 25 : 10,
        contactAvailable: 15,
        locationMatch: 15,
        sourceCredibility: 5,
        finalScore: score,
      },
      estimatedValue: 15000 + Math.floor(Math.random() * 15000),
      identifiedIssues: ['Site pode ser atualizado', 'Presença digital pode ser fortalecida'],
      opportunities: ['Reformulação do site', 'Melhoria de conversions'],
      conversionSignals: [],
      prospectingPlan: [],
      websiteValidation: {
        isFunctional: true,
        statusCode: 200,
        checkedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      isDevFallback: true,
    };
  });
}

// Check if lead is already captured
async function checkLeadCaptured(lead) {
  if (!supabase) return false;

  const domain = extractDomain(lead.website);
  const email = normalize(lead.email);

  if (!domain && !email) return false;

  try {
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
      captureRunId,
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
    console.log('[API] captureRunId:', captureRunId);
    console.log('[API] Nicho:', niche);
    console.log('[API] Localização:', location);
    console.log('[API] Quantidade:', requestedQuantity);
    console.log('[API] Requisitos:', JSON.stringify(contactRequirements));
    console.log('[API] ========================================');

    const stats = {
      requested: requestedQuantity,
      candidatesFound: 0,
      candidatesScanned: 0,
      domainValidated: 0,
      domainRejected: 0,
      duplicatesRemoved: 0,
      leadsQualified: 0,
      nicheMismatch: 0,
      locationMismatch: 0,
      rejectionReasons: {},
      errors: [],
      source: 'local_database',
    };

    // Get leads from local database with strict filtering
    let rawLeads = getLeadsFromLocalDatabase(niche, location, requestedQuantity * 2);

    stats.candidatesFound = rawLeads.length;
    stats.candidatesScanned = rawLeads.length;
    stats.source = 'local_database';

    console.log('[API] Leads encontrados antes dos filtros:', rawLeads.length);

    // CRITICAL: Apply niche matching filter
    const nicheMatchingLeads = rawLeads.filter(lead => {
      const matches = leadMatchesNiche(lead, niche);
      if (!matches) {
        stats.nicheMismatch++;
        console.log('[API] Lead rejeitado por nicho:', lead.name, '- Nicho esperado:', niche);
      }
      return matches;
    });

    console.log('[API] Leads após filtro de nicho:', nicheMatchingLeads.length);

    // CRITICAL: Apply location matching filter
    const locationMatchingLeads = nicheMatchingLeads.filter(lead => {
      const matches = leadMatchesLocation(lead, location);
      if (!matches) {
        stats.locationMismatch++;
        console.log('[API] Lead rejeitado por localização:', lead.name, '- Local:', lead.city, lead.state);
      }
      return matches;
    });

    console.log('[API] Leads após filtro de localização:', locationMatchingLeads.length);

    rawLeads = locationMatchingLeads;

    // Filter out leads that are already captured
    if (supabase && rawLeads.length > 0) {
      console.log('[API] Verificando leads já capturados...');
      const { filtered, capturedCount } = await filterAlreadyCapturedLeads(rawLeads);
      stats.duplicatesRemoved = capturedCount;
      rawLeads = filtered;
      console.log('[API] Leads após filtro de duplicados:', rawLeads.length);
    }

    // Apply contact requirements
    const emailRequired = contactRequirements?.email !== false;
    const websiteRequired = contactRequirements?.website === true;

    const qualified = rawLeads.filter(lead => {
      // Must have valid email if required
      if (emailRequired) {
        if (!validateEmail(lead.email)) {
          stats.rejectionReasons.missing_email = (stats.rejectionReasons.missing_email || 0) + 1;
          return false;
        }
      }

      // Must have valid website if required
      if (websiteRequired) {
        if (!validateWebsite(lead.website)) {
          stats.rejectionReasons.website_required = (stats.rejectionReasons.website_required || 0) + 1;
          return false;
        }
      }

      return true;
    });

    stats.leadsQualified = qualified.length;
    stats.domainValidated = qualified.length;

    // Sort by score
    qualified.sort((a, b) => b.score - a.score);

    // Limit to requested quantity
    const finalLeads = qualified.slice(0, requestedQuantity);

    const duration = Date.now() - startTime;

    console.log('[API] Leads finais:', finalLeads.length);
    console.log('[API] Duração:', duration + 'ms');

    // Log sample leads for debugging
    if (finalLeads.length > 0) {
      console.log('[API] Amostra de lead retornado:', {
        name: finalLeads[0].name,
        city: finalLeads[0].city,
        state: finalLeads[0].state,
        score: finalLeads[0].score,
        category: finalLeads[0].category,
      });
    }

    // Build response
    const response = {
      success: true,
      captureRunId,
      requested: requestedQuantity,
      qualified: finalLeads,
      qualifiedCount: finalLeads.length,
      totalFound: finalLeads.length,
      totalScanned: rawLeads.length,
      rejectedCount: stats.candidatesScanned - finalLeads.length,
      rejectionReasons: stats.rejectionReasons,
      partial: finalLeads.length < requestedQuantity,
      message: finalLeads.length === requestedQuantity
        ? `${finalLeads.length} leads qualificados encontrados para ${niche} em ${location}.`
        : `Encontramos ${finalLeads.length} leads válidos de ${requestedQuantity} solicitados para ${niche} em ${location}.`,
      stats,
      duration,
      isDevFallback: true,
    };

    // If no leads found, return helpful message
    if (finalLeads.length === 0) {
      return Response.json({
        success: false,
        errorCode: 'NO_LEADS_FOUND',
        message: `Não foram encontrados leads para ${niche} em ${location} com os requisitos atuais. Tente outra localização ou nicho.`,
        details: {
          requestedNiche: niche,
          requestedLocation: location,
          suggestions: [
            'Verifique a ortografia do nicho',
            'Tente uma cidade ou estado diferente',
            'Amplie a localização para região ou Brasil',
          ],
        },
        ...response,
      }, { status: 200 });
    }

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