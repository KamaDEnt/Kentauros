export const CAPTURE_METRICS = [
  {
    value: 'website_reformulation',
    label: 'Reformulação de sites',
    description: 'Prioriza empresas com site existente e sinais de baixa conversão.',
  },
  {
    value: 'new_website',
    label: 'Criação de sites',
    description: 'Prioriza empresas sem presença digital clara ou com site ausente.',
  },
  {
    value: 'website_correction',
    label: 'Correção de sites',
    description: 'Prioriza problemas técnicos, mobile, performance e confiança.',
  },
];

const ISSUE_LIBRARY = {
  website_reformulation: [
    {
      title: 'Proposta de valor pouco evidente',
      description: 'O visitante pode não entender rapidamente o diferencial da empresa.',
      impact: 16,
    },
    {
      title: 'Chamadas para ação fracas',
      description: 'O site não conduz com clareza para WhatsApp, formulário ou agendamento.',
      impact: 18,
    },
    {
      title: 'Hierarquia visual confusa',
      description: 'As informações comerciais parecem competir entre si e reduzem a leitura.',
      impact: 14,
    },
    {
      title: 'Poucas provas de confiança',
      description: 'Depoimentos, cases, selos ou números de resultado poderiam estar mais visíveis.',
      impact: 12,
    },
  ],
  new_website: [
    {
      title: 'Presença digital limitada',
      description: 'A empresa pode estar perdendo buscas de clientes por falta de uma vitrine clara.',
      impact: 24,
    },
    {
      title: 'Baixa captura de demanda',
      description: 'Sem uma página estruturada, visitantes interessados não encontram um caminho de contato.',
      impact: 20,
    },
    {
      title: 'Credibilidade comercial reduzida',
      description: 'Um site profissional ajudaria a validar a marca antes do primeiro contato.',
      impact: 16,
    },
  ],
  website_correction: [
    {
      title: 'Experiência mobile inconsistente',
      description: 'Elementos importantes podem ficar desalinhados ou pouco legíveis no celular.',
      impact: 18,
    },
    {
      title: 'Performance prejudicando conversão',
      description: 'Carregamento lento costuma aumentar abandono antes do contato comercial.',
      impact: 18,
    },
    {
      title: 'SEO técnico básico incompleto',
      description: 'Títulos, descrições e estrutura podem estar limitando alcance orgânico.',
      impact: 14,
    },
    {
      title: 'Formulário ou contato pouco destacado',
      description: 'O caminho para solicitar orçamento precisa ser mais direto.',
      impact: 16,
    },
  ],
};

const getMetricIssues = (metric) => ISSUE_LIBRARY[metric] || ISSUE_LIBRARY.website_reformulation;

const getStableSeed = (lead) => {
  const value = `${lead.name || ''}${lead.website || ''}`;
  return value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
};

export const analyzeLeadForMetric = (lead, metric = 'website_reformulation') => {
  const issues = getMetricIssues(metric);
  const seed = getStableSeed(lead);
  const issueCount = Math.min(issues.length, 3 + (seed % 2));
  const selectedIssues = issues.slice(0, issueCount);

  return {
    metric,
    issues: selectedIssues,
    opportunityScore: selectedIssues.reduce((total, issue) => total + issue.impact, 0),
  };
};

export const calculateCaptureScore = (lead, metric = 'website_reformulation') => {
  const analysis = analyzeLeadForMetric(lead, metric);
  const contactScore = (lead.email ? 18 : 0) + (lead.phone ? 10 : 0) + (lead.whatsapp ? 8 : 0);
  const websiteScore = lead.website ? 10 : metric === 'new_website' ? 34 : 0;
  const metricBonus = metric === 'new_website' && !lead.website ? 18 : 0;

  return Math.min(100, analysis.opportunityScore + contactScore + websiteScore + metricBonus);
};

export const calculateAiDevelopmentEstimatedValue = (lead, metric = 'website_reformulation') => {
  const analysis = analyzeLeadForMetric(lead, metric);
  const score = lead.score || calculateCaptureScore(lead, metric);
  const baseByMetric = {
    website_reformulation: 12000,
    new_website: 15000,
    website_correction: 8000,
  };
  const contactReadiness = (lead.email ? 1 : 0) + (lead.phone ? 0.6 : 0) + (lead.whatsapp ? 0.5 : 0);
  const aiEfficiencyFactor = 0.42;
  const scopeValue = (baseByMetric[metric] || baseByMetric.website_reformulation)
    + (analysis.opportunityScore * 180)
    + (score * 95)
    + (contactReadiness * 1200);

  const estimated = scopeValue * aiEfficiencyFactor;
  return Math.max(4500, Math.round(estimated / 500) * 500);
};

export const formatIssuesAsHtmlList = (issues = []) => {
  if (!issues.length) {
    return 'clareza da oferta e caminho de contato';
  }

  const friendlyLabels = {
    'Proposta de valor pouco evidente': 'clareza da oferta',
    'Chamadas para ação fracas': 'chamada para contato',
    'Hierarquia visual confusa': 'organização das informações',
    'Poucas provas de confiança': 'confiança da página',
    'Presença digital limitada': 'presença digital',
    'Baixa captura de demanda': 'caminho de conversão',
    'Credibilidade comercial reduzida': 'credibilidade online',
    'Experiência mobile inconsistente': 'experiência no celular',
    'Performance prejudicando conversão': 'velocidade de carregamento',
    'SEO técnico básico incompleto': 'visibilidade nas buscas',
    'Formulário ou contato pouco destacado': 'destaque dos canais de contato',
  };

  const labels = issues
    .slice(0, 3)
    .map(issue => friendlyLabels[issue.title] || String(issue.title || '').toLowerCase())
    .filter(Boolean);

  return labels.length ? labels.join(', ') : 'clareza da oferta e caminho de contato';
};
