export const CONSULTING_OFFER_TYPES = {
  website_reformulation: {
    label: 'Reformulacao de site',
    baseValue: 12000,
    conversionGoal: 'diagnostico_site',
  },
  new_website: {
    label: 'Criacao de site',
    baseValue: 15000,
    conversionGoal: 'presenca_digital',
  },
  website_correction: {
    label: 'Correcao de site',
    baseValue: 8000,
    conversionGoal: 'correcao_tecnica',
  },
  automation: {
    label: 'Automacao de processos',
    baseValue: 22000,
    conversionGoal: 'mapeamento_operacional',
  },
  software: {
    label: 'Desenvolvimento de software',
    baseValue: 45000,
    conversionGoal: 'discovery_produto',
  },
};

export const LEAD_JOURNEY_STAGES = [
  'captured',
  'qualified',
  'contacted',
  'responded',
  'discovery_scheduled',
  'discovery_completed',
  'proposal_sent',
  'won',
  'lost',
];

const normalize = (value = '') => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

export const getLeadConversionSignals = (lead = {}, metric = 'website_reformulation') => {
  const text = normalize([
    lead.name,
    lead.company,
    lead.website,
    lead.description,
    lead.bodyText,
    lead.notes,
    (lead.identifiedIssues || []).map(issue => issue.title).join(' '),
  ].filter(Boolean).join(' '));

  const signals = [];
  if (lead.email) signals.push({ key: 'email', label: 'E-mail encontrado', score: 16 });
  if (lead.phone) signals.push({ key: 'phone', label: 'Telefone encontrado', score: 8 });
  if (lead.whatsapp) signals.push({ key: 'whatsapp', label: 'WhatsApp encontrado', score: 10 });
  if (lead.website) signals.push({ key: 'website', label: 'Site ativo validado', score: 12 });
  if (/orcamento|agendar|contato|whatsapp|consulta|servico|solucao/.test(text)) {
    signals.push({ key: 'intent', label: 'Sinais comerciais no site', score: 14 });
  }
  if (/lento|mobile|responsivo|seo|conversao|site/.test(text) || metric !== 'new_website') {
    signals.push({ key: 'site_pain', label: 'Dor compatível com melhoria de site', score: 16 });
  }
  if (/sistema|software|app|portal|automacao|processo|integra/.test(text)) {
    signals.push({ key: 'software_pain', label: 'Potencial para software ou automacao', score: 18 });
  }

  return signals;
};

export const calculateConversionReadiness = (lead = {}, metric = 'website_reformulation') => {
  const signalScore = getLeadConversionSignals(lead, metric).reduce((sum, signal) => sum + signal.score, 0);
  const captureScore = Number(lead.score || 0);
  const readiness = Math.min(100, Math.round((captureScore * 0.45) + (signalScore * 0.55)));
  const tier = readiness >= 82 ? 'hot' : readiness >= 62 ? 'warm' : 'cold';

  return { readiness, tier };
};

export const buildProspectingPlan = (lead = {}, metric = 'website_reformulation') => {
  const { readiness, tier } = calculateConversionReadiness(lead, metric);
  const offer = CONSULTING_OFFER_TYPES[metric] || CONSULTING_OFFER_TYPES.website_reformulation;
  const actions = [
    'Enviar primeiro contato personalizado com diagnostico curto.',
    'Registrar retorno, objeção ou ausência de resposta no histórico do lead.',
    'Promover para Discovery somente com resposta, reunião marcada ou intenção clara.',
  ];

  if (tier === 'hot') {
    actions.unshift('Priorizar contato no mesmo dia e oferecer agenda objetiva de 15 minutos.');
  } else if (tier === 'warm') {
    actions.unshift('Enviar e-mail consultivo e follow-up em 2 dias úteis se não houver resposta.');
  } else {
    actions.unshift('Nutrir com abordagem leve e revisar dados antes de novo disparo.');
  }

  return {
    readiness,
    tier,
    offer,
    nextStage: tier === 'hot' ? 'qualified' : 'new',
    actions,
  };
};

export const createLeadInteraction = (type, description, metadata = {}) => ({
  id: crypto.randomUUID?.() || `interaction_${Date.now()}`,
  type,
  description,
  metadata,
  createdAt: new Date().toISOString(),
});

export const buildGmailSafeSendPolicy = ({ workspaceAccount = true, coldOutreach = true } = {}) => {
  const dailyLimit = workspaceAccount ? 2000 : 500;
  const recommendedDailyCap = coldOutreach ? Math.min(120, Math.floor(dailyLimit * 0.12)) : Math.floor(dailyLimit * 0.5);
  const minDelaySeconds = coldOutreach ? 45 : 12;

  return {
    provider: 'gmail',
    dailyLimit,
    recommendedDailyCap,
    minDelaySeconds,
    rules: [
      'Enviar um destinatario por mensagem.',
      'Pausar automaticamente em bounce, 429 ou erro de limite.',
      'Evitar repeticao de template sem personalizacao.',
      'Registrar opt-out e bloquear novos envios para o mesmo contato.',
    ],
  };
};
