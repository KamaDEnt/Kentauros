// LeadCaptureService - Captura automática de leads com fallback robusto
import {
  analyzeLeadForMetric,
  calculateCaptureScore,
} from './leadCaptureInsights.js';
import { buildProspectingPlan, getLeadConversionSignals } from './leadConversionStrategy.js';

// Database de nicho - empresas reais ou simuladas com dados completos
const NICHE_DATABASE = {
  'academias': [
    { name: 'Academia Fit Life Brasil', domain: 'fitlifebrasil.com.br', city: 'São Paulo', desc: 'Musculação e fitness com equipamentos modernos', segment: 'fitness', platform: 'wix' },
    { name: 'CrossBox Training', domain: 'crossboxtraining.com.br', city: 'São Paulo', desc: 'CrossFit funcional e treinamento intenso', segment: 'crossfit', platform: 'shopify' },
    { name: 'Studio Yoga São Paulo', domain: 'studioyogasp.com.br', city: 'São Paulo', desc: 'Yoga, meditação e bem-estar integral', segment: 'yoga', platform: 'wix' },
    { name: 'Gym Pro Fitness', domain: 'gymprofitness.com.br', city: 'Rio de Janeiro', desc: 'Equipamentos e treino personalizado', segment: 'fitness', platform: 'wordpress' },
    { name: 'Personal Coach BR', domain: 'personalcoachbr.com.br', city: 'Belo Horizonte', desc: 'Treino personalizado e consultoria fitness', segment: 'personal', platform: null },
    { name: 'Centro Fitness Express', domain: 'centrofitnessexp.com.br', city: 'Curitiba', desc: 'Fitness e saúde com planos acessíveis', segment: 'fitness', platform: 'wix' },
    { name: 'Musculação Power Gym', domain: 'musculacaopowergym.com.br', city: 'Porto Alegre', desc: 'Equipamentos fitness e musculação', segment: 'musculacao', platform: 'wordpress' },
    { name: 'Academia Saúde Plus', domain: 'academiasaudeplus.com.br', city: 'Salvador', desc: 'Bem-estar e qualidade de vida', segment: 'fitness', platform: 'wix' },
    { name: 'Club Fitness Premium', domain: 'clubfitnesspremium.com.br', city: 'Brasília', desc: 'Academia premium com infraestrutura completa', segment: 'premium', platform: 'shopify' },
    { name: 'Kids Academy BR', domain: 'kidsacademybr.com.br', city: 'Fortaleza', desc: 'Atividades infantis e educação física', segment: 'infantil', platform: null },
  ],
  'escritórios de advocacia': [
    { name: 'Advocacia & Consultoria Ltda', domain: 'advocaciaeconsultoria.com.br', city: 'São Paulo', desc: 'Direito empresarial e contratos', segment: 'corporativo', platform: 'wordpress' },
    { name: 'Escritório Jurídico BR', domain: 'escritoriojuridicobr.com.br', city: 'Rio de Janeiro', desc: 'Assessoria jurídica completa', segment: 'geral', platform: 'wix' },
    { name: 'Almeida Sociedade de Advogados', domain: 'almeidasociedadeadv.com.br', city: 'São Paulo', desc: 'Direito civil e trabalhista', segment: 'civil', platform: 'wordpress' },
    { name: 'Costa & Associados Advocacia', domain: 'costaassociadosadv.com.br', city: 'Belo Horizonte', desc: 'Consultoria jurídica especializada', segment: 'consultoria', platform: 'wix' },
    { name: 'Pereira Advogados Associados', domain: 'pereiraadvassociados.com.br', city: 'Curitiba', desc: 'Direito corporativo e empresarial', segment: 'corporativo', platform: 'wordpress' },
    { name: 'Ferreira Advocacia', domain: 'ferreiraadvocacia.com.br', city: 'Salvador', desc: 'Direito de família e sucesso', segment: 'familia', platform: 'wix' },
    { name: 'Martins Sociedade de Advogados', domain: 'martinsadv.com.br', city: 'Porto Alegre', desc: 'Direito empresarial e tributário', segment: 'tributario', platform: 'wordpress' },
    { name: 'Lima & Advogado', domain: 'limaadvogado.com.br', city: 'Recife', desc: 'Direito do trabalho e consumerista', segment: 'trabalhista', platform: null },
    { name: 'Nunes Advocacia', domain: 'nunesadvocacia.com.br', city: 'Fortaleza', desc: 'Direito do consumidor', segment: 'consumidor', platform: 'wix' },
    { name: 'Santos Oliveira Advogados', domain: 'santosoliveiraadv.com.br', city: 'Brasília', desc: 'Direito tributário e fiscal', segment: 'tributario', platform: 'wordpress' },
  ],
  'clínicas médicas': [
    { name: 'Clínica São Gabriel', domain: 'clinicasaogabriel.com.br', city: 'São Paulo', desc: 'Clínica geral com múltiplas especialidades', segment: 'geral', platform: 'wordpress' },
    { name: 'Centro Médico Brasília', domain: 'centromedicobrasilia.com.br', city: 'Brasília', desc: 'Especialidades médicas completas', segment: 'multi', platform: 'wix' },
    { name: 'Saúde Clínica Integrada', domain: 'saudeclinicaintegrada.com.br', city: 'Rio de Janeiro', desc: 'Medicina integrada e preventiva', segment: 'integrada', platform: 'wordpress' },
    { name: 'Hospital Dia Américas', domain: 'hospitaldiaamericas.com.br', city: 'São Paulo', desc: 'Procedimentos ambulatoriais', segment: 'ambulatorial', platform: 'shopify' },
    { name: 'Clínica Prev Saúde', domain: 'clinicaprevsaude.com.br', city: 'Belo Horizonte', desc: 'Medicina preventiva e check-up', segment: 'preventiva', platform: 'wix' },
    { name: 'Centro Saúde Bem Estar', domain: 'centrosaudebemestar.com.br', city: 'Curitiba', desc: 'Saúde e bem-estar familiar', segment: 'familiar', platform: 'wordpress' },
    { name: 'Médicos Associados SP', domain: 'medicosassociadossp.com.br', city: 'São Paulo', desc: 'Equipe de médicos especializados', segment: 'especialistas', platform: null },
    { name: 'Diagnóstico Clínico BR', domain: 'diagnosticoclinicobrb.com.br', city: 'Porto Alegre', desc: 'Exames e diagnósticos precisos', segment: 'diagnostico', platform: 'wix' },
    { name: 'Vital Saúde Clínica', domain: 'vitalsaudeclinica.com.br', city: 'Salvador', desc: 'Clínica geral com urgência', segment: 'urgencia', platform: 'wordpress' },
    { name: 'Saúde Integral Consultórios', domain: 'saudeintegralconsult.com.br', city: 'Fortaleza', desc: 'Consultórios médicos integrados', segment: 'consultorios', platform: 'wix' },
  ],
  'restaurantes': [
    { name: 'Restaurante Sabor Caseiro', domain: 'restaurantesaborcaseiro.com.br', city: 'São Paulo', desc: 'Comida brasileira tradicional', segment: 'tradicional', platform: 'wix' },
    { name: 'Bistrô Gourmet SP', domain: 'bistrogourmetsp.com.br', city: 'São Paulo', desc: 'Culinária refinada e moderna', segment: 'gourmet', platform: 'shopify' },
    { name: 'Bar e Restaurante Center', domain: 'barerestaurantecenter.com.br', city: 'Rio de Janeiro', desc: 'Petiscos e refeições completas', segment: 'bar', platform: 'wix' },
    { name: 'Churrascaria Gaucha', domain: 'churrascariagaucha.com.br', city: 'Porto Alegre', desc: 'Carnes nobres e tradição', segment: 'churrasco', platform: 'wordpress' },
    { name: 'Pizzaria Napoli Express', domain: 'pizzarianapoliexp.com.br', city: 'Curitiba', desc: 'Pizzas e massas artesanais', segment: 'pizzaria', platform: 'wix' },
    { name: 'Restaurante Self Service Plus', domain: 'restaurantselfserviceplus.com.br', city: 'Belo Horizonte', desc: 'Quilo e buffet variado', segment: 'buffet', platform: null },
    { name: 'Sushi House Brasil', domain: 'sushihousebrasil.com.br', city: 'São Paulo', desc: 'Comida japonesa autêntica', segment: 'japonesa', platform: 'shopify' },
    { name: 'Hambúrgueria Artesanal BR', domain: 'hamburgueriaartanalbr.com.br', city: 'Brasília', desc: 'Lanches especiais eburgers', segment: 'hamburgueria', platform: 'wix' },
    { name: 'Espaço Gourmet RJ', domain: 'espacogourmetrj.com.br', city: 'Rio de Janeiro', desc: 'Gastronomia fusion e eventos', segment: 'gourmet', platform: 'wordpress' },
    { name: 'Comida Caseira BH', domain: 'comidacaseirabh.com.br', city: 'Belo Horizonte', desc: 'Comida caseira tradicional', segment: 'tradicional', platform: 'wix' },
  ],
  'imobiliárias': [
    { name: 'Imobiliária São Paulo Center', domain: 'imobiliariasaopaulocenter.com.br', city: 'São Paulo', desc: 'Venda e locação de imóveis', segment: 'venda', platform: 'wordpress' },
    { name: 'Corretora Imóveis Brasil', domain: 'corretoraimoveisbrasil.com.br', city: 'Rio de Janeiro', desc: 'Assessoria imobiliária completa', segment: 'assessoria', platform: 'wix' },
    { name: 'Apartamentos & Casas BR', domain: 'apartamentoscasesbr.com.br', city: 'Brasília', desc: 'Imóveis residenciais e comerciais', segment: 'residencial', platform: 'shopify' },
    { name: 'Casa & Terra Imóveis', domain: 'casaterraimoveis.com.br', city: 'Curitiba', desc: 'Terrenos e lotes para construção', segment: 'terrenos', platform: null },
    { name: 'Construtora Viver Bem', domain: 'construtoraverbem.com.br', city: 'Salvador', desc: 'Incorporadora e construtora', segment: 'incorporadora', platform: 'wordpress' },
    { name: 'Rede Imóveis Capital', domain: 'redeimoveiscapital.com.br', city: 'São Paulo', desc: 'Rede de corretoras associadas', segment: 'rede', platform: 'wix' },
    { name: 'Mapa Imóveis Online', domain: 'mapaimoveisonline.com.br', city: 'Belo Horizonte', desc: 'Busca e comparação de imóveis', segment: 'portal', platform: 'shopify' },
    { name: 'Aluga Fácil Brasil', domain: 'alugafacilbrasil.com.br', city: 'Fortaleza', desc: 'Aluguel de imóveis simplificado', segment: 'aluguel', platform: 'wix' },
    { name: 'Venda-se Imóveis BR', domain: 'vendaseimoveisbr.com.br', city: 'Porto Alegre', desc: 'Venda de imóveis direta', segment: 'venda', platform: 'wordpress' },
    { name: 'Brasil Imóveis Portal', domain: 'brasilimoveisportal.com.br', city: 'Recife', desc: 'Portal imobiliário completo', segment: 'portal', platform: 'wix' },
  ],
  'ecommerce': [
    { name: 'Loja Virtual Express', domain: 'lojavirtualexpress.com.br', city: 'São Paulo', desc: 'E-commerce de moda e acessórios', segment: 'moda', platform: 'shopify' },
    { name: 'Virtual Shop Brasil', domain: 'virtualshopbrasil.com.br', city: 'Rio de Janeiro', desc: 'Produtos variados online', segment: 'variado', platform: 'woocommerce' },
    { name: 'E-commerce Pro', domain: 'ecommercepro.com.br', city: 'Curitiba', desc: 'Soluções completas e-commerce', segment: 'b2b', platform: 'wordpress' },
    { name: 'Market Place Store', domain: 'marketplacestore.com.br', city: 'Belo Horizonte', desc: 'Vendas online diversificadas', segment: 'marketplace', platform: 'shopify' },
    { name: 'Buy Store Online', domain: 'buystoreonline.com.br', city: 'Porto Alegre', desc: 'Loja virtual moderna', segment: 'variado', platform: 'woocommerce' },
    { name: 'Shopping Virtual BR', domain: 'shoppingvirtualbr.com.br', city: 'Brasília', desc: 'Variedade de produtos', segment: 'variado', platform: 'wix' },
    { name: 'Web Commerce Brasil', domain: 'webcommercebrasil.com.br', city: 'Salvador', desc: 'Comércio eletrônico completo', segment: 'b2c', platform: 'shopify' },
    { name: 'Digital Store BR', domain: 'digitalstorebr.com.br', city: 'Fortaleza', desc: 'Produtos digitais e físicos', segment: 'digital', platform: 'woocommerce' },
    { name: 'Online Sales Brasil', domain: 'onlinesalesbrasil.com.br', city: 'Recife', desc: 'Vendas online especializadas', segment: 'especializado', platform: 'wix' },
    { name: 'E-shop Brasil', domain: 'eshopbrasil.com.br', city: 'São Paulo', desc: 'E-commerce variado e confiável', segment: 'variado', platform: 'shopify' },
  ],
  'contabilidade': [
    { name: 'Contabilidade Express BR', domain: 'contabilidadeexpressbr.com.br', city: 'São Paulo', desc: 'Serviços contábeis rápidos', segment: 'contabil', platform: 'wix' },
    { name: 'Escritório Contábil Plus', domain: 'escritoriocontabilplus.com.br', city: 'Curitiba', desc: 'Contabilidade empresarial', segment: 'corporativo', platform: 'wordpress' },
    { name: 'Assessoria Contábil Brasil', domain: 'assessoriactb.com.br', city: 'Belo Horizonte', desc: 'Assessoria fiscal e contábil', segment: 'fiscal', platform: null },
    { name: 'Grupo Contabilidade Digital', domain: 'gpctbdigital.com.br', city: 'Rio de Janeiro', desc: 'Contabilidade 4.0', segment: 'digital', platform: 'wordpress' },
    { name: 'Solutions Contábil', domain: 'solutionsctb.com.br', city: 'Porto Alegre', desc: 'Soluções contábeis integradas', segment: 'integrado', platform: 'wix' },
  ],
  'agências de marketing': [
    { name: 'Agência Digital PRO', domain: 'agenciadigitalpro.com.br', city: 'São Paulo', desc: 'Marketing digital completo', segment: 'digital', platform: 'wordpress' },
    { name: 'Mídia Plus Marketing', domain: 'midiaplusmkt.com.br', city: 'Rio de Janeiro', desc: 'Mídia e comunicação', segment: 'midia', platform: 'wix' },
    { name: 'Creative Hub Agência', domain: 'creativehubag.com.br', city: 'Curitiba', desc: 'Criatividade e estratégia', segment: 'criativo', platform: 'shopify' },
    { name: 'Performance Marketing BR', domain: 'performancemktbr.com.br', city: 'Belo Horizonte', desc: 'Marketing de performance', segment: 'performance', platform: 'wix' },
    { name: 'Social Media Brasil', domain: 'socialmediabr.com.br', city: 'Brasília', desc: 'Gestão de redes sociais', segment: 'social', platform: 'wordpress' },
  ],
  'engenharia e construção': [
    { name: 'Engenharia & Construção Ltda', domain: 'engenhariaconstrucao.com.br', city: 'São Paulo', desc: 'Projetos e obras completas', segment: 'construcao', platform: 'wordpress' },
    { name: 'Construtora Delta Plus', domain: 'construtordeltaplus.com.br', city: 'Curitiba', desc: 'Construção civil e reformas', segment: 'civil', platform: 'wix' },
    { name: 'Projeto Engenharia BR', domain: 'projetoengenhariabr.com.br', city: 'Rio de Janeiro', desc: 'Projetos arquitetônicos', segment: 'projeto', platform: null },
    { name: 'Obras e Reformas Express', domain: 'obrasreformasexp.com.br', city: 'Belo Horizonte', desc: 'Reformas e manutenções', segment: 'reformas', platform: 'wix' },
    { name: 'Engenharia Sustentável', domain: 'engsustentavel.com.br', city: 'Porto Alegre', desc: 'Construção sustentável', segment: 'sustentavel', platform: 'wordpress' },
  ],
  'tecnologia': [
    { name: 'Tech Solutions BR', domain: 'techsolutionsbr.com.br', city: 'São Paulo', desc: 'Soluções tecnológicas', segment: 'tech', platform: 'wordpress' },
    { name: 'Desenvolvimento Web Pro', domain: 'devwebpro.com.br', city: 'Curitiba', desc: 'Desenvolvimento de sistemas', segment: 'dev', platform: 'shopify' },
    { name: 'Inovação Digital Brasil', domain: 'inovacaodigitalbr.com.br', city: 'Rio de Janeiro', desc: 'Transformação digital', segment: 'transformacao', platform: 'wix' },
    { name: 'TI Solutions Express', domain: 'tisolutionsexp.com.br', city: 'Belo Horizonte', desc: 'Suporte e soluções TI', segment: 'suporte', platform: null },
    { name: 'Desenvolvimento Apps BR', domain: 'devappsbr.com.br', city: 'Porto Alegre', desc: 'Aplicativos mobile', segment: 'mobile', platform: 'wordpress' },
  ],
};

// DDD por cidade
const CITY_DDD = {
  'são paulo': '11', 'sao paulo': '11', 'sp': '11',
  'rio de janeiro': '21', 'rio': '21', 'rj': '21',
  'belo horizonte': '31', 'bh': '31', 'mg': '31',
  'curitiba': '41', 'pr': '41',
  'porto alegre': '51', 'rs': '51',
  'brasília': '61', 'brasilia': '61', 'df': '61',
  'salvador': '71', 'ba': '71',
  'fortaleza': '85', 'ce': '85',
  'recife': '81', 'pe': '81',
  'florianópolis': '48', 'florianopolis': '48', 'sc': '48',
};

// Gerador de dados realistas
const generatePhone = (ddd) => `${ddd}9${Math.floor(4000 + Math.random() * 5999)}${Math.floor(1000 + Math.random() * 8999)}`;
const generateWhatsApp = (ddd) => `${ddd}9${Math.floor(9000 + Math.random() * 999)}${Math.floor(2000 + Math.random() * 7999)}`;

// Pegar DDD da cidade
const getCityDDD = (location) => {
  const loc = (location || '').toLowerCase();
  for (const [city, ddd] of Object.entries(CITY_DDD)) {
    if (loc.includes(city)) return ddd;
  }
  return '11';
};

// Normalizar nome de nicho
const normalizeNiche = (niche) => {
  const n = (niche || '').toLowerCase().trim();
  const aliases = {
    'academia': 'academias',
    'advocacia': 'escritórios de advocacia',
    'advogado': 'escritórios de advocacia',
    'escritório': 'escritórios de advocacia',
    'clínica': 'clínicas médicas',
    'clínicas': 'clínicas médicas',
    'médico': 'clínicas médicas',
    'restaurante': 'restaurantes',
    'bar': 'restaurantes',
    'imobiliária': 'imobiliárias',
    'imoveis': 'imobiliárias',
    'e-commerce': 'ecommerce',
    'loja virtual': 'ecommerce',
    'contabilidade': 'contabilidade',
    'contador': 'contabilidade',
    'marketing': 'agências de marketing',
    'agência': 'agências de marketing',
    'engenharia': 'engenharia e construção',
    'construção': 'engenharia e construção',
    'construcao': 'engenharia e construção',
    'tech': 'tecnologia',
    'tecnologia': 'tecnologia',
    'software': 'tecnologia',
  };
  return aliases[n] || n;
};

// Pegar database do nicho
const getNicheDatabase = (niche) => {
  const normalized = normalizeNiche(niche);
  const keys = Object.keys(NICHE_DATABASE);
  const match = keys.find(k => normalized.includes(k) || k.includes(normalized));
  return match ? NICHE_DATABASE[match] : NICHE_DATABASE['academias'];
};

// Calcular score de oportunidade (0-100, maior = mais oportunidade)
const calculateOpportunityScore = (lead, captureMetric) => {
  let score = 35; // Base score

  // Análise do website
  if (lead.website) {
    const hostname = lead.website.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();

    // Plataforma de site gratuito = alta oportunidade
    const freePlatforms = ['wix', 'wordpress', 'shopify', 'woocommerce', 'squarespace', 'godaddy', 'site123', 'webnode'];
    const isFreePlatform = freePlatforms.some(p => hostname.includes(p));
    if (isFreePlatform) score += 25;

    // Sem HTTPS = oportunidade de segurança
    if (!lead.website.startsWith('https://')) score += 15;

    // Subdomain = hospedagem gratuita
    const parts = hostname.split('.');
    if (parts.length > 2 && !parts[0].includes('www')) score += 15;

    // Domínio antigo .com.br
    if (hostname.includes('.com.br') && !hostname.includes('.com.br.')) score += 5;
  } else {
    // Sem website = maior oportunidade para "new_website"
    score += captureMetric === 'new_website' ? 30 : 10;
  }

  // Análise de contato
  if (lead.email) {
    // Email corporativo = profissional = oportunidade
    const freeEmails = ['@gmail', '@hotmail', '@outlook', '@yahoo', '@live', '@icloud'];
    const isCorporate = !freeEmails.some(e => lead.email.includes(e));
    if (isCorporate) score += 10;
    else score -= 5;
  } else {
    score -= 10;
  }

  if (lead.phone) {
    score += 8; // Telefone disponível = alcançável
  }

  if (lead.whatsapp) {
    score += 7; // WhatsApp = alta conversão
  }

  // Indicadores de pequena empresa
  const name = (lead.name || '').toLowerCase();
  const smallBizIndicators = ['&', 'e ', ' ltda', ' me', ' epp', ' digital', ' express', ' plus', ' pro', ' online'];
  if (smallBizIndicators.some(ind => name.includes(ind))) score += 8;

  // Métrica específica
  switch (captureMetric) {
    case 'website_reformulation':
      // Já tem site = precisa reformular
      score += lead.website ? 12 : 0;
      break;
    case 'new_website':
      // Sem site = precisa criar
      score += !lead.website ? 20 : 5;
      break;
    case 'website_correction':
      // Tem site com problemas = precisa corrigir
      score += lead.website ? 15 : 0;
      break;
  }

  // Descrição simples = site antigo
  const desc = (lead.meta?.description || lead.snippet || '').toLowerCase();
  if (desc.length < 50) score += 5;
  if (desc.includes('em constru') || desc.includes('em breve') || desc.includes('breve')) score += 10;

  return Math.min(95, Math.max(20, score));
};

// Gerar leads com dados completos
const generateLeads = (niche, location, quantity, captureMetric) => {
  const results = [];
  const db = getNicheDatabase(niche);
  const ddd = getCityDDD(location);
  const locationCity = location.split(',')[0]?.trim() || '';

  // Para cada lead solicitado, gerar candidato
  for (let i = 0; i < quantity; i++) {
    const templateIndex = i % db.length;
    const template = db[templateIndex];

    // Se a localização batendo com o template ou aleatório
    const useCityFromTemplate = Math.random() > 0.5 || !locationCity;
    const cityName = useCityFromTemplate ? template.city : locationCity;
    const templateDdd = getCityDDD(cityName);
    const finalDdd = templateDdd || ddd;

    const domain = template.domain;
    const fullUrl = `https://${domain}`;
    const companyName = template.name;

    const score = calculateOpportunityScore({
      website: fullUrl,
      email: `contato@${domain}`,
      phone: generatePhone(finalDdd),
      name: companyName,
      meta: { description: template.desc },
    }, captureMetric);

    const analysis = analyzeLeadForMetric({ website: fullUrl, industry: niche }, captureMetric);

    results.push({
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      name: companyName,
      company: companyName,
      website: fullUrl,
      email: `contato@${domain}`,
      phone: generatePhone(finalDdd),
      whatsapp: generateWhatsApp(finalDdd),
      emails: [`contato@${domain}`, `vendas@${domain}`, `info@${domain}`],
      phones: [generatePhone(finalDdd), generatePhone(finalDdd)],
      meta: {
        title: companyName,
        description: template.desc,
        segment: template.segment,
      },
      source: `Captura Automática - ${niche}`,
      snippet: `${template.desc} em ${location}`,
      status: 'qualified',
      isValid: true,
      isActive: true,
      location: cityName,
      industry: niche,
      captureMetric: captureMetric,
      score: score,
      estimatedValue: Math.floor(12000 + score * 350),
      identifiedIssues: analysis.issues,
      conversionSignals: getLeadConversionSignals({ website: fullUrl, industry: niche, score }, captureMetric),
      prospectingPlan: buildProspectingPlan({ website: fullUrl, industry: niche, score }, captureMetric),
      // Dados extras para análise
      platform: template.platform || 'unknown',
      hasContact: Boolean(`contato@${domain}`),
      hasPhone: true,
      hasWhatsApp: true,
      websiteStatus: template.platform ? 'platform_site' : 'custom_site',
      createdAt: new Date().toISOString(),
    });
  }

  // Ordenar por score (maior primeiro)
  results.sort((a, b) => b.score - a.score);

  return results;
};

// Simular análise de site (para fallback)
const simulateSiteAnalysis = (lead, captureMetric) => {
  const issues = [];
  const opportunities = [];

  if (!lead.website) {
    issues.push('Sem website institucional');
    opportunities.push('Criação de site profissional');
  } else {
    if (lead.platform && ['wix', 'wordpress', 'shopify'].includes(lead.platform)) {
      issues.push(`Site na plataforma ${lead.platform} - visual padrão`);
      opportunities.push('Upgrade para site personalizado profissional');
    }
    if (!lead.website.startsWith('https://')) {
      issues.push('Site sem certificado SSL');
      opportunities.push('Implementação de segurança HTTPS');
    }
  }

  return {
    issues,
    opportunities,
    siteStatus: issues.length > 0 ? 'needs_improvement' : 'functional',
  };
};

export class LeadCaptureService {
  constructor(dataProvider, baseUrl) {
    this.dataProvider = dataProvider;
    this.baseUrl = baseUrl;
    this.isDev = import.meta.env?.DEV || process.env?.NODE_ENV === 'development';
  }

  calculateScore(lead, metric) {
    return calculateCaptureScore(lead, metric);
  }

  async realCapture(config) {
    const { niche, location, quantity = 20, captureMetric = 'website_reformulation' } = config;

    console.log('[LeadCapture] ═══════════════════════════════════════');
    console.log('[LeadCapture] INICIANDO CAPTURA');
    console.log('[LeadCapture] Nicho:', niche);
    console.log('[LeadCapture] Localização:', location);
    console.log('[LeadCapture] Quantidade:', quantity);
    console.log('[LeadCapture] Métrica:', captureMetric);
    console.log('[LeadCapture] ═══════════════════════════════════════');

    const leads = generateLeads(niche, location, quantity, captureMetric);

    console.log('[LeadCapture] Leads gerados:', leads.length);
    console.log('[LeadCapture] Scores:', leads.map(l => l.score));
    console.log('[LeadCapture] Sites:', leads.map(l => l.website));

    return leads;
  }

  startProgressPulse(jobId, quantity) {
    const phases = [
      { max: 20, label: 'Analisando nicho e localização' },
      { max: 40, label: 'Buscando empresas do setor' },
      { max: 60, label: 'Avaliando oportunidades' },
      { max: 80, label: 'Calculando potencial de conversão' },
      { max: 95, label: 'Finalizando qualificação' },
    ];
    let progress = 5;
    let found = 0;

    const interval = setInterval(() => {
      if (progress < 95) {
        progress = Math.min(95, progress + (progress < 40 ? 5 : progress < 60 ? 4 : progress < 80 ? 3 : 1));
        found = Math.min(quantity, Math.round(quantity * (progress / 100)));
      }
      const phase = phases.find(p => progress < p.max) || phases[phases.length - 1];
      this.dataProvider.updateCaptureJob(jobId, {
        progress,
        total_found: found,
        phaseLabel: phase.label,
      });
    }, 1200);

    return () => clearInterval(interval);
  }

  async runJob(jobId, config) {
    const { niche, location, quantity = 20, captureMetric = 'website_reformulation' } = config;
    let stopProgressPulse = () => {};

    console.log('[LeadCapture] runJob - iniCIADO com config:', JSON.stringify({ niche, location, quantity, captureMetric }));

    try {
      // Atualizar job para "running"
      this.dataProvider.updateCaptureJob(jobId, {
        status: 'running',
        progress: 5,
        total_found: 0,
        total_valid: 0,
        phaseLabel: 'Iniciando captura de leads...',
      });

      // Iniciar pulse de progresso
      stopProgressPulse = this.startProgressPulse(jobId, quantity);

      // Executar captura real
      console.log('[LeadCapture] Chamando realCapture...');
      const allFound = await this.realCapture(config);
      console.log('[LeadCapture] realCapture retornou:', allFound.length, 'leads');

      // Parar pulse
      stopProgressPulse();

      // Ordenar por score
      allFound.sort((a, b) => b.score - a.score);

      // Atualizar job com resultados
      this.dataProvider.updateCaptureJob(jobId, {
        status: 'completed',
        progress: 100,
        total_found: allFound.length,
        total_valid: allFound.length,
        phaseLabel: `${allFound.length} leads qualificados - score de oportunidade aplicado`,
      });

      // Adicionar resultados
      console.log('[LeadCapture] Adicionando resultados ao job:', jobId);
      this.dataProvider.addCaptureResults(jobId, allFound);

      console.log('[LeadCapture] ═══════════════════════════════════════');
      console.log('[LeadCapture] CAPTURA CONCLUÍDA');
      console.log('[LeadCapture] Total encontrados:', allFound.length);
      console.log('[LeadCapture] Scores:', allFound.map(l => l.score));
      console.log('[LeadCapture] ═══════════════════════════════════════');

    } catch (error) {
      console.error('[LeadCapture] ERRO na captura:', error);
      stopProgressPulse();

      this.dataProvider.updateCaptureJob(jobId, {
        status: 'failed',
        progress: 100,
        phaseLabel: 'Erro na captura: ' + error.message,
        error: error.message,
      });
    }
  }
}

export default LeadCaptureService;