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
