import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useApp } from '../context/AppContext';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import { canAccessAdmin, getMeetingReadyClients } from '../services/operationalWorkflow';
import { buildProposalDocument, downloadTextFile, renderProposalDocumentText } from '../services/deliveryDocuments';

const getStatusType = (status) => {
  if (['approved', 'signed', 'won'].includes(status)) return 'success';
  if (status === 'sent') return 'accent';
  if (status === 'rejected') return 'danger';
  return 'secondary';
};

const Proposals = () => {
  const { proposals = [], discoveries, leads, clients, addProposal, updateProposal, addProject, addBacklog, addQaTest, addDeployment, addAutomation, addApprovalRequest, addLearningEvent } = useData();
  const { user, addNotification } = useApp();
  const meetingClients = useMemo(() => getMeetingReadyClients(discoveries, leads, clients), [discoveries, leads, clients]);
  const [selectedDiscoveryId, setSelectedDiscoveryId] = useState(meetingClients[0]?.id || '');

  const selectedMeeting = meetingClients.find(item => String(item.id) === String(selectedDiscoveryId));

  useEffect(() => {
    if (!selectedDiscoveryId && meetingClients[0]) {
      setSelectedDiscoveryId(meetingClients[0].id);
    }
  }, [meetingClients, selectedDiscoveryId]);

  const handleGenerateProposal = () => {
    if (!selectedMeeting) {
      addNotification('Reuniao obrigatoria', 'Selecione um cliente com reuniao realizada para gerar a proposta.', 'error');
      return;
    }

    addProposal({
      discoveryId: selectedMeeting.discoveryId,
      clientName: selectedMeeting.clientName,
      title: `Proposta Comercial - ${selectedMeeting.clientName}`,
      status: 'draft',
      value: selectedMeeting.suggestedValue,
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      documents: ['Escopo comercial', 'Cronograma', 'Termos de aceite'],
      summary: selectedMeeting.summary,
      approvalFlow: [
        { step: 'Comercial', status: 'approved', at: new Date().toISOString(), userId: user?.id },
        { step: 'Admin', status: 'pending' },
        { step: 'Cliente', status: 'pending' },
      ],
    });

    addNotification('Proposta gerada', `Proposta criada com base na reuniao de ${selectedMeeting.clientName}.`, 'success');
  };

  const handleSignProposal = (proposal) => {
    if (!canAccessAdmin(user)) {
      addApprovalRequest({
        entity_type: 'Proposal',
        entity_id: String(proposal.id),
        requested_by: user?.id,
        approver_role: 'ADMIN',
        status: 'pending',
        payload: proposal,
        title: `Aprovar proposta - ${proposal.clientName}`,
      });
      updateProposal(proposal.id, { status: 'pending_approval' });
      addNotification('Aprovação solicitada', 'A proposta foi enviada para aprovação Admin antes de virar projeto.', 'info');
      return;
    }

    const proposalDocument = buildProposalDocument({
      proposal,
      discovery: discoveries.find(item => String(item.id) === String(proposal.discoveryId)),
    });
    updateProposal(proposal.id, {
      status: 'approved',
      signedAt: new Date().toISOString(),
      tag: 'Assinado, apto para inicio',
      proposalDocument,
      approvalFlow: [
        ...(proposal.approvalFlow || []).filter(step => step.step !== 'Admin' && step.step !== 'Cliente'),
        { step: 'Admin', status: 'approved', at: new Date().toISOString(), userId: user?.id },
        { step: 'Cliente', status: 'signed', at: new Date().toISOString() },
      ],
    });
    const project = addProject({
      name: proposal.title.replace('Proposta Comercial - ', 'Projeto '),
      client: proposal.clientName,
      status: 'ready',
      readinessTag: 'Assinado, apto para inicio',
      progress: 0,
      priority: 'high',
      budget: proposal.value,
      spent: 0,
      team: [8],
      tags: ['SDD', 'Discovery', 'Apto para inicio'],
      phases: [
        { name: 'Spec SDD', status: 'pending' },
        { name: 'Backlog', status: 'pending' },
        { name: 'Desenvolvimento', status: 'pending' },
        { name: 'QA', status: 'pending' },
        { name: 'Deploy', status: 'pending' },
      ],
      versions: [
        {
          id: `project_start_${Date.now()}`,
          label: 'Projeto criado a partir da proposta',
          source: 'proposal',
          createdAt: new Date().toISOString(),
          proposalId: proposal.id,
          status: 'ready',
        },
      ],
    });

    const baseTasks = [
      ['Spec SDD e critérios de aceite', 'Converter decisões do Discovery em especificação validável.', 'high'],
      ['Checklist UX/UI do cliente', 'Mapear solicitações visuais, telas e componentes esperados.', 'medium'],
      ['Implementação assistida por IA', 'Executar desenvolvimento seguindo prompt e aprovação do DEV.', 'high'],
      ['QA, evidências e documentação', 'Validar testes e documentação antes do deploy.', 'high'],
    ];

    baseTasks.forEach(([title, description, priority], index) => {
      addBacklog({
        projectId: project.id,
        title,
        description,
        priority,
        type: 'task',
        status: 'todo',
        assignee: 8,
        assigneeEmail: 'marcos@kentauros.com',
        order: index + 1,
        tags: ['SDD', 'Discovery', 'IA'],
      });
    });

    addQaTest({
      projectId: project.id,
      title: `Validação inicial - ${proposal.clientName}`,
      type: 'ia_delivery',
      status: 'pending',
      priority: 'high',
      environment: 'staging',
      documentation: 'Aguardando desenvolvimento SDD para gerar evidências.',
    });

    addDeployment({
      projectId: project.id,
      env: 'staging',
      version: 'pendente',
      status: 'aguardando_qa',
      notes: 'Deploy aguardando QA aprovado.',
    });

    addAutomation({
      name: `Fluxo projeto - ${proposal.clientName}`,
      trigger: 'proposal.status = approved',
      action: 'create_project_backlog_qa_deploy',
      status: 'completed',
      runs: 1,
      success: 1,
      lastRun: new Date().toISOString().split('T')[0],
      projectId: project.id,
    });
    addLearningEvent({
      source: 'approval',
      event_type: 'proposal_signed_project_created',
      title: `Projeto criado para ${proposal.clientName}`,
      content: `Proposta aprovada e convertida em projeto com backlog, QA e deploy inicial.`,
      project_id: String(project.id),
      tags: ['Proposal', 'Project', 'Approval'],
      metadata: { proposalId: proposal.id, projectId: project.id },
    });
    addNotification('Projeto criado', 'Proposta assinada e projeto liberado para inicio.', 'success');
  };

  const downloadProposal = (proposal) => {
    const document = proposal.proposalDocument || buildProposalDocument({
      proposal,
      discovery: discoveries.find(item => String(item.id) === String(proposal.discoveryId)),
    });
    downloadTextFile(`${String(proposal.clientName).replace(/\s+/g, '-').toLowerCase()}-proposta-kentauros.md`, renderProposalDocumentText(document));
    addLearningEvent({
      source: 'proposal',
      event_type: 'proposal_document_downloaded',
      title: proposal.title,
      content: 'Documento formal de proposta baixado para validação/envio ao cliente.',
      tags: ['Proposal', 'Document'],
      metadata: { proposalId: proposal.id },
    });
  };

  return (
    <div className="proposals-page animate-fade-in">
      <PageHeader
        title="Propostas"
        subtitle="Gere propostas a partir de reunioes realizadas e do contexto do Discovery."
        actions={<Button variant="primary" onClick={handleGenerateProposal}>Gerar proposta</Button>}
      />

      <Card className="mb-xl">
        <div className="grid grid-2">
          <Select
            label="Cliente com reuniao realizada"
            value={selectedDiscoveryId}
            onChange={setSelectedDiscoveryId}
            options={meetingClients.map(item => ({ value: item.id, label: `${item.clientName} - ${item.status}` }))}
          />
          <div>
            <div className="text-xs text-muted mb-xs">Base da proposta</div>
            <p className="text-sm text-secondary">{selectedMeeting?.summary || 'Nenhuma reuniao aprovada encontrada.'}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-3 mb-xl">
        <StatCard label="Pipeline total" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposals.reduce((acc, p) => acc + Number(p.value || 0), 0))} />
        <StatCard label="Aguardando assinatura" value={proposals.filter(p => ['sent', 'draft'].includes(p.status)).length} />
        <StatCard label="Assinadas" value={proposals.filter(p => ['approved', 'signed', 'won'].includes(p.status)).length} />
      </div>

      <Card className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Proposta</th>
              <th>Cliente</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Documentos</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {proposals.map(proposal => (
              <tr key={proposal.id}>
                <td>
                  <div className="font-bold">{proposal.title}</div>
                  <div className="text-xs text-muted">Discovery: {proposal.discoveryId || 'manual'}</div>
                </td>
                <td>{proposal.clientName}</td>
                <td className="font-mono">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposal.value || 0)}</td>
                <td><Badge variant={getStatusType(proposal.status)}>{proposal.status}</Badge></td>
                <td className="text-xs text-muted">{(proposal.documents || ['Escopo', 'Valores', 'Termos']).join(', ')}</td>
                <td>
                  <div className="flex gap-sm">
                    <Button variant="secondary" size="sm" onClick={() => downloadProposal(proposal)}>PDF</Button>
                    {!['approved', 'signed', 'won'].includes(proposal.status) && (
                      <Button variant="primary" size="sm" onClick={() => handleSignProposal(proposal)}>Assinar</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default Proposals;
