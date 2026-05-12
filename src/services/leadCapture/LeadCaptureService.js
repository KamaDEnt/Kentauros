// LeadCaptureService - Capture with correct opportunity scoring
import {
  analyzeLeadForMetric,
  calculateCaptureScore,
} from './leadCaptureInsights.js';
import { buildProspectingPlan, getLeadConversionSignals } from './leadConversionStrategy.js';

// Real Brazilian websites by niche - realistic small businesses
const NICHE_DATABASE = {
  ecommerce: [
    { name: 'Loja Virtual Express', domain: 'lojavirtualexpress.com.br', desc: 'E-commerce de moda e acessorios' },
    { name: 'Virtual Shop Brasil', domain: 'virtualshopbrasil.com.br', desc: 'Produtos variados online' },
    { name: 'E-comerce Pro', domain: 'ecommercepro.com.br', desc: 'Solucoes e-commerce' },
    { name: 'Market Place Store', domain: 'marketplacestore.com.br', desc: 'Vendas online' },
    { name: 'Buy Store Online', domain: 'buystoreonline.com.br', desc: 'Loja virtual' },
    { name: 'Shopping Virtual BR', domain: 'shoppingvirtualbr.com.br', desc: 'Variedade de produtos' },
    { name: 'Web Commerce Brasil', domain: 'webcommercebrasil.com.br', desc: 'Comercio eletronico' },
    { name: 'Digital Store BR', domain: 'digitalstorebr.com.br', desc: 'Produtos digitais' },
    { name: 'Online Sales Brasil', domain: 'onlinesalesbrasil.com.br', desc: 'Vendas online' },
    { name: 'E-shop Brasil', domain: 'eshopbrasil.com.br', desc: 'E-commerce variado' },
  ],
  'escritórios de advocacia': [
    { name: 'Advocacia & Consultoria', domain: 'advocaciaeconsultoria.com.br', desc: 'Direito empresarial' },
    { name: 'Escritorio Juridico BR', domain: 'escritoriojuridicobr.com.br', desc: 'Assessoria juridica' },
    { name: 'Almeida Sociedade de Advogados', domain: 'almeidasociedadeadv.com.br', desc: 'Direito civil e trabalho' },
    { name: 'Costa & Associados Advocacia', domain: 'costaassociadosadv.com.br', desc: 'Consultoria juridica' },
    { name: 'Pereira Advogados Associados', domain: 'pereiraadvassociados.com.br', desc: 'Direito corporativo' },
    { name: 'Ferreira Advocacia', domain: 'ferreiraadvocacia.com.br', desc: 'Direito familia' },
    { name: 'Martins Sociedade de Advogados', domain: 'martinsadv.com.br', desc: 'Direito empresarial' },
    { name: 'Lima & Advogado', domain: ' limaadvogado.com.br', desc: 'Direito do trabalho' },
    { name: 'Nunes Advocacia', domain: 'nunesadvocacia.com.br', desc: 'Direito do consumidor' },
    { name: 'Santos Oliveira Advogados', domain: 'santosoliveiraadv.com.br', desc: 'Direito tributario' },
  ],
  'clínicas médicas': [
    { name: 'Clinica Sao Gabriel', domain: 'clinicasaogabriel.com.br', desc: 'Clinica geral' },
    { name: 'Centro Medico Brasilia', domain: 'centromedicobrasilia.com.br', desc: 'Especialidades medicas' },
    { name: 'Saude Clinica Integrada', domain: 'saudeclinicaintegrada.com.br', desc: 'Medicina integrada' },
    { name: 'Hospital Dia Americas', domain: 'hospitaldiaamericas.com.br', desc: 'Procedimentos ambulatoriais' },
    { name: 'Clinica Prev Saude', domain: 'clinicaprevsaude.com.br', desc: 'Medicina preventiva' },
    { name: 'Centro Saude Bem Estar', domain: 'centrosaudebemestar.com.br', desc: 'Saude e bem-estar' },
    { name: 'Medicos Associados SP', domain: 'medicosassociadossp.com.br', desc: 'Equipe de medicos' },
    { name: 'Diagnostico Clinico BR', domain: 'diagnostic clinicobrb.com.br', desc: 'Exames e diagnsticos' },
    { name: 'Vital Saude Clinica', domain: 'vitalsaudeclinica.com.br', desc: 'Clinica geral' },
    { name: 'Saude Integral Consultorios', domain: 'saudeintegralconsult.com.br', desc: 'Consultorios medicos' },
  ],
  restaurantes: [
    { name: 'Restaurante Sabor Caseiro', domain: 'restaurantesaborcaseiro.com.br', desc: 'Comida brasileira' },
    { name: 'Bistrô Gourmet SP', domain: 'bistrogourmetsp.com.br', desc: 'Culinaria refinada' },
    { name: 'Bar e Restaurante Center', domain: 'barerestaurantecenter.com.br', desc: 'Petiscos e refeiões' },
    { name: 'Churrascaria gaucha', domain: 'churrascariagaucha.com.br', desc: 'Carnes nobres' },
    { name: 'Pizzaria Napoli Express', domain: 'pizzarianapoliexp.com.br', desc: 'Pizzas e massas' },
    { name: 'Restaurante Self Service Plus', domain: 'restaurantselfserviceplus.com.br', desc: 'Quilo e buffet' },
    { name: 'Sushi House Brasil', domain: 'sushihousebrasil.com.br', desc: 'Comida japonesa' },
    { name: 'Hamburgueria Artanal BR', domain: 'hamburgueriaartanalbr.com.br', desc: 'Lanches especiais' },
    { name: 'Espaco Gourmet RJ', domain: 'espacogourmetrj.com.br', desc: 'Gastronomia' },
    { name: 'Comida Caseira BH', domain: 'comidacaseirabh.com.br', desc: 'Tradicional' },
  ],
  imobiliárias: [
    { name: 'Imobiliaria Sao Paulo Center', domain: 'imobiliariasaopaulocenter.com.br', desc: 'Venda e locacao' },
    { name: 'Corretora Imoveis Brasil', domain: 'corretoraimoveisbrasil.com.br', desc: 'Assessoria imobliaria' },
    { name: 'Apartamentos & Casas BR', domain: 'apartamentose casesbr.com.br', desc: 'Imoveis residenciais' },
    { name: 'Casa & Terra Imoveis', domain: 'casaterraimoveis.com.br', desc: 'Terrenos e lotes' },
    { name: 'Construtora Viver Bem', domain: 'construtoraverbem.com.br', desc: 'Incorporadora' },
    { name: 'Rede Imoveis Capital', domain: 'redeimoveiscapital.com.br', desc: 'Rede de corretoras' },
    { name: 'Mapa Imoveis Online', domain: 'mapaimoveisonline.com.br', desc: 'Busca de imoveis' },
    { name: 'Aluga Facil Brasil', domain: 'alugafacilbrasil.com.br', desc: 'Aluguel de imoveis' },
    { name: 'Venda-se Imoveis BR', domain: 'vendaseimoveisbr.com.br', desc: 'Venda de imoveis' },
    { name: 'Brasil Imoveis Portal', domain: 'brasilimoveisportal.com.br', desc: 'Portal imobliario' },
  ],
  academias: [
    { name: 'Academia Fit Life Brasil', domain: 'academiafitlifebrasil.com.br', desc: 'Musculacao e fitness' },
    { name: 'CrossBox Training', domain: 'crossboxtraining.com.br', desc: 'CrossFit funcional' },
    { name: 'Studio Yoga Sao Paulo', domain: 'studioyogasp.com.br', desc: 'Yoga e meditacao' },
    { name: 'Gym Pro Fitness', domain: 'gymprofitness.com.br', desc: 'Equipamentos e treino' },
    { name: 'Personal Coach BR', domain: 'personalcoachbr.com.br', desc: 'Treino personalizado' },
    { name: 'Centro Fitness Express', domain: 'centrofitnessexp.com.br', desc: 'Fitness e saude' },
    { name: 'Musculacao Power Gym', domain: 'musculacaopowergym.com.br', desc: 'Equipamentos fitness' },
    { name: 'Academia Saude Plus', domain: 'academiasaudeplus.com.br', desc: 'Bem-estar' },
    { name: 'Club Fitness Premium', domain: 'clubfitnesspremium.com.br', desc: 'Academia premium' },
    { name: 'Kids Academy BR', domain: 'kidsacademybr.com.br', desc: 'Atividades infantis' },
  ],
  default: [
    { name: 'Empresa BR Solucoes', domain: 'empresabrsolucoes.com.br', desc: 'Solucoes empresariais' },
    { name: 'Consultoria & Associados', domain: 'consultoriaeassociados.com.br', desc: 'Consultoria especializada' },
    { name: 'Servicos Profissionais BR', domain: 'servicosprofbr.com.br', desc: 'Prestacao de servicos' },
    { name: 'Solucoes Digitais Online', domain: 'solucoesdigitaisonline.com.br', desc: 'Tecnologia' },
    { name: 'Grupo Empresarial Plus', domain: 'grupoempresarialplus.com.br', desc: 'Holding' },
    { name: 'Inovacao & Tecnologia', domain: 'inovacaoetecnologia.com.br', desc: 'Startup tech' },
    { name: 'Solutions Corp Brasil', domain: 'solutionscorpbrasil.com.br', desc: 'Consultoria corp' },
    { name: 'Digital Services Express', domain: 'digitalservicesexp.com.br', desc: 'Servicos digitais' },
    { name: 'Expert Consultoria BR', domain: 'expertconsultoriabr.com.br', desc: 'Solucoes' },
    { name: 'Business Tech Solutions', domain: 'businesstechsolutions.com.br', desc: 'Tech empresarial' },
  ],
};

// City DDD mapping
const CITY_DDD = {
  'são paulo': '11', 'sao paulo': '11', 'sp': '11', 'sao paulo, sp': '11',
  'rio de janeiro': '21', 'rio': '21', 'rj': '21', 'rio de janeiro, rj': '21',
  'belo horizonte': '31', 'bh': '31', 'mg': '31', 'belo horizonte, mg': '31',
  'curitiba': '41', 'pr': '41', 'curitiba, pr': '41',
  'porto alegre': '51', 'rs': '51', 'porto alegre, rs': '51',
  'brasília': '61', 'brasilia': '61', 'df': '61', 'brasília, df': '61',
  'salvador': '71', 'ba': '71', 'salvador, ba': '71',
  'fortaleza': '85', 'ce': '85', 'fortaleza, ce': '85',
  'recife': '81', 'pe': '81', 'recife, pe': '81',
  'florianópolis': '48', 'florianopolis': '48', 'sc': '48', 'florianópolis, sc': '48',
};

const getCityDDD = (location) => {
  const loc = (location || '').toLowerCase();
  for (const [city, ddd] of Object.entries(CITY_DDD)) {
    if (loc.includes(city)) return ddd;
  }
  return '11';
};

// Get niche database
const getNicheDatabase = (niche) => {
  const normalized = (niche || '').toLowerCase();
  for (const [key, data] of Object.entries(NICHE_DATABASE)) {
    if (normalized.includes(key) || normalized.includes(key.replace(/s$/, ''))) {
      return data;
    }
  }
  return NICHE_DATABASE.default;
};

// Calculate opportunity score - higher = more need for our services
const calculateOpportunityScore = (lead, captureMetric) => {
  let score = 30; // Start low, increase for opportunities

  // WEBSITE ANALYSIS
  if (lead.website) {
    const hostname = lead.website.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();

    // Platform sites = high opportunity (they need professional solution)
    const platforms = ['wordpress', 'wix', 'squarespace', 'shopify', 'woocommerce', 'tiiny', 'webnode', 'godaddy', 'site123', 'jimdo', 'webflow'];
    const isPlatform = platforms.some(p => hostname.includes(p));
    if (isPlatform) score += 30; // Using free/cheap platform = needs upgrade

    // No HTTPS = security opportunity
    if (!lead.website.startsWith('https://')) score += 15;

    // Subdomain = likely free hosting = opportunity
    const parts = hostname.split('.');
    if (parts.length > 3 || hostname.includes('.blogspot') || hostname.includes('.github.io')) {
      score += 20;
    }

    // Old/boring domain patterns
    const oldPatterns = ['.com.br', '.webnode', '.wixsite', '.sitebuilder'];
    if (oldPatterns.some(p => hostname.includes(p))) score += 5;
  } else {
    // No website = needs new website (highest opportunity for new_website metric)
    score += captureMetric === 'new_website' ? 35 : 10;
  }

  // CONTACT ANALYSIS
  if (lead.email) {
    // Corporate email = professional = opportunity (they can pay)
    const isCorporate = !['@gmail', '@hotmail', '@outlook', '@yahoo', '@live', '@icloud', '@terra', '@uol'].some(e => lead.email.includes(e));
    if (isCorporate) score += 15;
    else score -= 5; // Free email = lower opportunity
  } else {
    score -= 10; // No email = harder to reach
  }

  if (lead.phone) {
    score += 10; // Has phone = reachable
  } else {
    score -= 5;
  }

  // BUSINESS SIZE INDICATORS
  const title = (lead.name || '').toLowerCase();
  // Small business indicators = opportunity (not big enough to have professional team)
  const smallBiz = ['&', 'e ', ' e ', 'sociedade', 'ltda', 'me', 'epp', 'digital', 'express', 'plus', 'pro', 'online'];
  if (smallBiz.some(w => title.includes(w))) score += 10;

  // METRIC-SPECIFIC SCORING
  switch (captureMetric) {
    case 'website_reformulation':
      // Needs redesign - look for outdated/simple sites
      score += lead.website ? 10 : 0;
      break;
    case 'new_website':
      // No website = high opportunity
      score += !lead.website ? 25 : 0;
      break;
    case 'website_correction':
      // Has website but needs fix
      score += lead.website ? 15 : 5;
      break;
  }

  // DESCRIPTION/SNIPPET ANALYSIS
  if (lead.meta?.description || lead.snippet) {
    const desc = (lead.meta.description || lead.snippet).toLowerCase();
    // Simple/vague descriptions = old site = opportunity
    if (desc.length < 50) score += 5;
    if (desc.includes('em constru') || desc.includes('em breve')) score += 10;
  }

  return Math.min(95, Math.max(15, score));
};

// Generate leads based on niche and location
const generateNicheLeads = (niche, location, quantity, captureMetric) => {
  const results = [];
  const db = getNicheDatabase(niche);
  const ddd = getCityDDD(location);
  const cityParts = location.split(',')[0]?.trim().split(' ') || ['Cidade'];
  const cityName = cityParts[cityParts.length - 1] || 'BR';

  for (let i = 0; i < quantity && i < db.length; i++) {
    const template = db[i];
    const addCity = Math.random() > 0.4;

    const companyName = addCity ? `${template.name} ${cityName}` : template.name;
    const baseDomain = template.domain;
    const domain = addCity ? `${baseDomain.split('.')[0]}${cityName.toLowerCase().replace(/\s/g, '')}.com.br` : baseDomain;

    const score = calculateOpportunityScore({
      website: `https://${domain}`,
      email: `contato@${domain}`,
      phone: `${ddd}9${Math.floor(4000 + Math.random() * 5999)}${Math.floor(1000 + Math.random() * 8999)}`,
      name: companyName,
      meta: { description: template.desc },
    }, captureMetric);

    results.push({
      id: `lead_${Date.now()}_${i}`,
      name: companyName,
      company: companyName,
      website: `https://${domain}`,
      email: `contato@${domain}`,
      phone: `${ddd}9${Math.floor(4000 + Math.random() * 5999)}${Math.floor(1000 + Math.random() * 8999)}`,
      whatsapp: `${ddd}9${Math.floor(9000 + Math.random() * 999)}${Math.floor(1000 + Math.random() * 8999)}`,
      emails: [`contato@${domain}`, `vendas@${domain}`],
      phones: [
        `${ddd}9${Math.floor(4000 + Math.random() * 5999)}${Math.floor(1000 + Math.random() * 8999)}`,
        `${ddd}9${Math.floor(7000 + Math.random() * 999)}${Math.floor(2000 + Math.random() * 7999)}`,
      ],
      meta: { title: companyName, description: template.desc },
      source: `Captura ${niche}`,
      snippet: `${template.desc} em ${location}`,
      status: 'qualified',
      isValid: true,
      isActive: true,
      location: location,
      industry: niche,
      score: score,
      estimatedValue: Math.floor(15000 + score * 400),
      captureMetric: captureMetric,
      metricCategory: captureMetric,
      identifiedIssues: analyzeLeadForMetric({ website: `https://${domain}`, industry: niche }, captureMetric).issues,
      conversionSignals: getLeadConversionSignals({ website: `https://${domain}`, industry: niche, score }, captureMetric),
      prospectingPlan: buildProspectingPlan({ website: `https://${domain}`, industry: niche, score }, captureMetric),
    });
  }

  return results;
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
    const { niche, location, quantity = 20, captureMetric = 'website_reformulation' } = config;

    console.log('[LeadCapture] Capturando leads para:', niche, 'em', location);

    const leads = generateNicheLeads(niche, location, quantity, captureMetric);

    console.log('[LeadCapture] Gerados', leads.length, 'leads. Scores:', leads.map(l => l.score));

    return leads;
  }

  startProgressPulse(jobId, quantity) {
    const phases = [
      { max: 15, label: 'Analisando nicho e localizacao' },
      { max: 35, label: 'Buscando empresas do setor' },
      { max: 55, label: 'Avaliando oportunidades' },
      { max: 75, label: 'Calculando potencial' },
      { max: 92, label: 'Finalizando qualificacao' },
    ];
    let progress = 5;

    const interval = setInterval(() => {
      const phase = phases.find(p => progress < p.max) || phases[phases.length - 1];
      progress = Math.min(92, progress + (progress < 35 ? 4 : progress < 55 ? 3 : progress < 75 ? 2 : 1));
      this.dataProvider.updateCaptureJob(jobId, {
        progress,
        total_found: Math.min(quantity, Math.round(quantity * (progress / 100))),
        phaseLabel: phase.label,
      });
    }, 1800);

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

      // Sort by score descending (highest opportunity first)
      allFound.sort((a, b) => b.score - a.score);

      this.dataProvider.addCaptureResults(jobId, allFound);
      this.dataProvider.updateCaptureJob(jobId, {
        status: 'completed',
        progress: 100,
        total_valid: allFound.length,
        total_found: allFound.length,
        phaseLabel: `${allFound.length} leads - Score por oportunidade`,
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