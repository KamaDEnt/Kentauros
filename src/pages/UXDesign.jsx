import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useApp } from '../context/AppContext';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { getUxRequests } from '../services/operationalWorkflow';

const UXDesign = () => {
  const { projects, backlog, discoveries, learningEvents, updateBacklog, addWorkflowRun, addLearningEvent } = useData();
  const { addNotification } = useApp();
  const uxRequests = useMemo(() => getUxRequests(projects, backlog, discoveries, learningEvents), [projects, backlog, discoveries, learningEvents]);

  const approveUx = (id) => {
    const item = uxRequests.find(request => request.id === id);
    if (Number.isFinite(Number(id))) {
      updateBacklog(id, { uxStatus: 'Aprovado pelo DEV', status: 'review', uxApprovedAt: new Date().toISOString() });
    }
    addWorkflowRun({
      agent: 'UX_REVIEW',
      taskId: Number.isFinite(Number(id)) ? Number(id) : null,
      projectId: backlog.find(task => task.id === id)?.projectId || item?.projectId || null,
      status: 'approved',
      mode: 'automatic',
      output: `UX/UI aprovado: ${item?.request || id}`,
    });
    addLearningEvent({
      source: 'ux',
      event_type: 'ux_request_approved',
      title: item?.request || 'UX/UI aprovado',
      content: (item?.suggestions || []).join(' '),
      project_id: String(item?.projectId || ''),
      tags: ['UX', 'Approval', 'Discovery'],
      metadata: { requestId: id, approvalStatus: 'Aprovado pelo DEV', projectName: item?.project, clientName: item?.client },
    });
    addNotification('UX/UI aprovado', 'Solicitacao visual validada para seguir no desenvolvimento.', 'success');
  };

  const generateStructure = () => {
    addLearningEvent({
      source: 'ux',
      event_type: 'ux_structure_generated',
      title: 'Estrutura UX/UI gerada',
      content: 'Checklist visual preparado a partir de Discovery, backlog, reunioes e solicitacoes de cliente.',
      tags: ['UX', 'Checklist', 'SDD'],
      metadata: { totalRequests: uxRequests.length },
    });
    addNotification('Estrutura gerada', 'Fluxo preparado para wireframe, checklist visual e aprovacao do DEV.', 'info');
  };

  return (
    <div className="ux-design-page animate-fade-in">
      <PageHeader
        title="UX/UI Design"
        subtitle="Solicitacoes visuais vindas do Discovery, backlog e execucao automatica."
        actions={<Button variant="primary" onClick={generateStructure}>Gerar estrutura</Button>}
      />

      <div className="grid grid-4 mb-xl">
        <StatCard label="Solicitacoes visuais" value={uxRequests.length} />
        <StatCard label="Aguardando validacao" value={uxRequests.filter(item => item.status !== 'Aprovado pelo DEV').length} />
        <StatCard label="Projetos impactados" value={new Set(uxRequests.map(item => item.project)).size} />
        <StatCard label="Origem Discovery" value={uxRequests.filter(item => item.origin !== 'Backlog aprovado').length} />
      </div>

      <Card title="Itens de UX/UI para verificacao do DEV">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Projeto</th>
                <th>Solicitacao</th>
                <th>Origem</th>
                <th>Sugestoes</th>
                <th>Critérios</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {uxRequests.map(item => (
                <tr key={item.id}>
                  <td>
                    <div className="font-bold">{item.project}</div>
                    <div className="text-xs text-muted">{item.client}</div>
                  </td>
                  <td>{item.request}</td>
                  <td className="text-xs text-muted">{item.origin}</td>
                  <td>
                    <ul style={{ paddingLeft: '1rem' }}>
                      {item.suggestions.slice(0, 2).map(suggestion => <li key={suggestion} className="text-xs text-muted">{suggestion}</li>)}
                    </ul>
                  </td>
                  <td className="text-xs text-muted">Contraste, responsividade, clareza do fluxo e aderencia ao Discovery.</td>
                  <td><Badge variant={item.status === 'Aprovado pelo DEV' ? 'success' : 'warning'}>{item.status}</Badge></td>
                  <td><Button variant="secondary" size="sm" onClick={() => approveUx(item.id)}>Aprovar</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default UXDesign;
