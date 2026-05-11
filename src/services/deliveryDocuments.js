const brl = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

export const buildProposalDocument = ({ proposal, discovery, clientContext = {} }) => {
  const scope = [
    'Diagnóstico e alinhamento de requisitos com base na reunião Discovery.',
    'Planejamento do projeto em SDD com etapas aprováveis.',
    'Desenvolvimento com apoio de IA, validação técnica e acompanhamento humano.',
    'QA com evidências, documentação e liberação controlada para deploy.',
  ];
  const decisions = discovery?.decisions?.length ? discovery.decisions : ['Decisões serão confirmadas antes do início do projeto.'];
  const rules = discovery?.rules?.length ? discovery.rules : ['Mudanças de escopo exigem nova aprovação comercial.'];

  return {
    title: proposal.title,
    clientName: proposal.clientName,
    value: proposal.value,
    validUntil: proposal.validUntil,
    generatedAt: new Date().toISOString(),
    sections: [
      { title: 'Resumo executivo', items: [proposal.summary || discovery?.summary || 'Proposta gerada a partir do processo comercial Kentauros.'] },
      { title: 'Escopo proposto', items: scope },
      { title: 'Decisões consideradas', items: decisions },
      { title: 'Regras comerciais', items: rules },
      { title: 'Valores e condições', items: [`Investimento estimado: ${brl(proposal.value)}`, `Validade da proposta: ${proposal.validUntil || '15 dias'}`] },
    ],
    clientContext,
  };
};

export const renderProposalDocumentText = (document) => [
  `# ${document.title}`,
  '',
  `Cliente: ${document.clientName}`,
  `Valor: ${brl(document.value)}`,
  `Gerado em: ${new Date(document.generatedAt).toLocaleString('pt-BR')}`,
  '',
  ...document.sections.flatMap(section => [
    `## ${section.title}`,
    ...section.items.map(item => `- ${item}`),
    '',
  ]),
].join('\n');

export const buildProjectVersion = ({ project, label = 'snapshot', source = 'manual', metadata = {} }) => ({
  id: crypto.randomUUID?.() || `version_${Date.now()}`,
  label,
  source,
  projectId: project.id,
  createdAt: new Date().toISOString(),
  status: project.status,
  progress: project.progress || 0,
  deployVersion: project.deployVersion || null,
  gitRepository: project.gitRepository || null,
  metadata,
});

export const buildQaEvidenceDocument = ({ item, projectName }) => ({
  id: crypto.randomUUID?.() || `qa_doc_${Date.now()}`,
  title: `Evidências QA - ${item.title}`,
  projectName,
  generatedAt: new Date().toISOString(),
  checks: [
    'Critérios de aceite revisados',
    'Fluxo principal validado em staging',
    'Documentação técnica revisada',
    'Riscos e pendências registrados',
  ],
  result: item.status === 'failed' ? 'reprovado' : 'aprovado',
  notes: item.documentation || 'Documento de QA gerado pelo fluxo Kentauros.',
});

export const renderQaEvidenceText = (document) => [
  `# ${document.title}`,
  '',
  `Projeto: ${document.projectName}`,
  `Resultado: ${document.result}`,
  `Gerado em: ${new Date(document.generatedAt).toLocaleString('pt-BR')}`,
  '',
  '## Evidências',
  ...document.checks.map(check => `- ${check}`),
  '',
  '## Observações',
  document.notes,
].join('\n');

export const downloadTextFile = (filename, content) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};

export const buildContractDocument = ({ proposal, discovery, client }) => {
  const today = new Date().toLocaleDateString('pt-BR');
  const validUntil = proposal.validUntil || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return {
    id: crypto.randomUUID?.() || `contract_${Date.now()}`,
    title: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE DESENVOLVIMENTO DE SOFTWARE',
    proposalId: proposal.id,
    clientName: client?.company || proposal.clientName,
    clientContact: client?.contact || 'Responsável pelo projeto',
    clientEmail: client?.email || '',
    clientPhone: client?.phone || '',
    providerName: 'Kentauros Soluções Tecnológicas LTDA',
    providerCNPJ: 'XX.XXX.XXX/0001-XX',
    providerAddress: 'Cidade - UF',
    value: proposal.value,
    valueFormatted: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposal.value || 0),
    paymentCondition: discovery?.paymentCondition || 'Conforme acordado em proposta',
    startDate: proposal.createdAt || today,
    validUntil,
    deliveryScope: discovery?.scope || discovery?.requirements?.map(r => r.title || r.name).filter(Boolean) || [],
    createdAt: new Date().toISOString(),
    clauses: [
      {
        number: '1',
        title: 'DO OBJETO',
        content: 'O presente contrato tem como objeto a prestação de serviços de desenvolvimento de software personalizado, conforme escopo definido na proposta comercial vinculada a este contrato.'
      },
      {
        number: '2',
        title: 'DAS OBRIGAÇÕES DA CONTRATADA',
        content: 'A Contratada se compromete a: a) Executar os serviços conforme cronograma acordado; b) Manter comunicação ativa com o Contratante; c) Entregar documentação técnica dos sistemas desenvolvidos; d) Garantir qualidade e adherence aos padrões acordados.'
      },
      {
        number: '3',
        title: 'DAS OBRIGAÇÕES DO CONTRATANTE',
        content: 'O Contratante se compromete a: a) Fornecer as informações necessárias para execução do projeto; b) Realizar testes e validações dentro dos prazos acordados; c) Efetuar os pagamentos nas datas estabelecidas; d) Designar responsável para interlocução.'
      },
      {
        number: '4',
        title: 'DO VALOR E CONDIÇÕES DE PAGAMENTO',
        content: `O valor total dos serviços é de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposal.value || 0)}, a ser pago conforme condições definidas na proposta comercial.`
      },
      {
        number: '5',
        title: 'DO PRAZO DE EXECUÇÃO',
        content: `O prazo estimado para conclusão do projeto é de 90 (noventa) dias, contados a partir da assinatura deste contrato e aprovação do início dos trabalhos pelo Contratante.`
      },
      {
        number: '6',
        title: 'DA PROPRIEDADE INTELECTUAL',
        content: 'Os direitos patrimoniais do software desenvolvido permanecerão com o Contratante após a conclusão e pagamento integral do projeto. A Contratada mantém direito de uso do conhecimento técnico adquirido.'
      },
      {
        number: '7',
        title: 'DA CONFIDENCIALIDADE',
        content: 'Ambas as partes se comprometem a manter sigilo sobre informações confidenciais trocadas durante a execução do projeto, não as divulgando a terceiros sem autorização prévia.'
      },
      {
        number: '8',
        title: 'DAS PENALIDADES',
        content: 'O descumprimento de qualquer cláusula deste contrato sujeitará a parte infratora às penalidades previstas em lei, sem prejuízo de perdas e danos.'
      },
      {
        number: '9',
        title: 'DO FORO',
        content: 'Fica Elias escolhido o foro da comarca de São Paulo/SP para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.'
      }
    ]
  };
};

export const renderContractDocumentText = (contract) => {
  const clauses = contract.clauses.map(c =>
    `${c.number}. ${c.title}\n${c.content}\n`
  ).join('\n');

  return [
    '# CONTRATO DE PRESTAÇÃO DE SERVIÇOS',
    '',
    '## IDENTIFICAÇÃO DAS PARTES',
    '',
    `CONTRATADA: ${contract.providerName}`,
    `CNPJ: ${contract.providerCNPJ}`,
    `Endereço: ${contract.providerAddress}`,
    '',
    `CONTRATANTE: ${contract.clientName}`,
    `Responsável: ${contract.clientContact}`,
    `E-mail: ${contract.clientEmail}`,
    `Telefone: ${contract.clientPhone}`,
    '',
    `Data de assinatura: ${contract.startDate}`,
    `Validade até: ${contract.validUntil}`,
    '',
    '## CLAUSULAS',
    '',
    clauses,
    '',
    '## ASSINATURAS',
    '',
    '_______________________________________',
    `${contract.providerName}`,
    'Contratada',
    '',
    '_______________________________________',
    `${contract.clientName}`,
    `${contract.clientContact}`,
    'Contratante',
    '',
    '---',
    `Documento gerado em ${new Date(contract.createdAt).toLocaleString('pt-BR')}`,
  ].join('\n');
};

export const downloadContractDocument = (contract) => {
  const content = renderContractDocumentText(contract);
  const filename = `contrato-${String(contract.clientName).replace(/\s+/g, '-').toLowerCase()}-kentauros.txt`;
  downloadTextFile(filename, content);
};
