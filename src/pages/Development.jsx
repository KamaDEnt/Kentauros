import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useApp } from '../context/AppContext';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { canAccessDev, getSddItems } from '../services/operationalWorkflow';

const Development = () => {
  const { projects, backlog, discoveries, workflowRuns, updateBacklog, updateWorkflowRun, addWorkflowRun, addQaTest, addLearningEvent } = useData();
  const { user, addNotification } = useApp();
  const sddItems = useMemo(() => getSddItems(projects, backlog, discoveries), [projects, backlog, discoveries]);

  if (!canAccessDev(user)) {
    return (
      <div className="development-page animate-fade-in">
        <Card title="Acesso restrito">
          <p className="text-muted">Somente usuarios com tag DEV podem acessar o desenvolvimento.</p>
        </Card>
      </div>
    );
  }

  const approveDecision = (item) => {
    updateBacklog(item.id, { sddApproval: 'approved', sddApprovedAt: new Date().toISOString(), status: 'review' });
    const run = workflowRuns.find(entry => String(entry.taskId) === String(item.id));
    if (run) {
      updateWorkflowRun(run.id, {
        approval_status: 'approved',
        status: 'implemented_waiting_qa',
        completed_at: new Date().toISOString(),
        output_artifacts: {
          summary: 'Implementacao automatizada concluida em modo SDD e enviada para QA.',
          documentation: `Atividade ${item.task} implementada conforme decisao aprovada pelo DEV.`,
        },
      });
    }
    addQaTest({
      projectId: backlog.find(task => task.id === item.id)?.projectId,
      taskId: item.id,
      title: `QA SDD - ${item.task}`,
      type: 'sdd_automation',
      status: 'pending',
      environment: 'staging',
      documentation: `Validar entrega automatizada: ${item.decision}`,
      developerApproval: 'pending',
    });
    addLearningEvent({
      source: 'development',
      event_type: 'sdd_decision_approved',
      title: item.task,
      content: item.decision,
      tags: ['Development', 'SDD', 'Approval'],
      metadata: { taskId: item.id, workflowRunId: run?.id },
    });
    addNotification('Decisao aprovada', `${item.task} pode seguir no fluxo automatizado.`, 'success');
  };

  const startSddAutomation = () => {
    const pendingItems = sddItems.filter(item => item.automationMode === 'kentauros_auto' && !workflowRuns.some(run => String(run.taskId) === String(item.id)));
    pendingItems.forEach(item => {
      addWorkflowRun({
        agent: 'DEV_SDD',
        taskId: item.id,
        projectId: backlog.find(task => task.id === item.id)?.projectId,
        mode: 'kentauros_auto',
        status: 'waiting_dev_approval',
        approval_status: 'pending',
        input_context: { decision: item.decision, task: item },
        output_artifacts: {},
        started_at: new Date().toISOString(),
      });
    });
    addLearningEvent({
      source: 'development',
      event_type: 'sdd_automation_started',
      title: 'Automacao SDD iniciada',
      content: `${pendingItems.length} runs preparados para aprovacao DEV.`,
      tags: ['Development', 'SDD', 'Automation'],
      metadata: { total: pendingItems.length },
    });
    addNotification('Automação SDD', `${pendingItems.length} runs preparados para aprovação.`, 'success');
  };

  return (
    <div className="development-page animate-fade-in">
      <PageHeader
        title="Desenvolvimento SDD"
        subtitle="Acompanhe a execução automática, specs e decisões da IA antes de aprovar."
        actions={<Button variant="primary" onClick={startSddAutomation}>Iniciar automação</Button>}
      />

      <div className="grid grid-4 mb-xl">
        <StatCard label="Specs SDD" value={sddItems.length} />
        <StatCard label="Pendentes de aprovação" value={sddItems.filter(item => item.specStatus !== 'aprovada').length} />
        <StatCard label="Modo automatico" value={sddItems.filter(item => item.automationMode === 'kentauros_auto').length} />
        <StatCard label="Runs SDD" value={workflowRuns.filter(run => run.agent === 'DEV_SDD').length} />
      </div>

      <Card title="Decisões da IA para aprovação do DEV">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Projeto</th>
                <th>Atividade</th>
                <th>Spec/Decisão</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {sddItems.map(item => (
                <tr key={item.id}>
                  <td>{item.project}</td>
                  <td>
                    <div className="font-bold">{item.task}</div>
                    <div className="text-xs text-muted">{item.automationMode}</div>
                  </td>
                  <td className="text-sm text-secondary">{item.decision}</td>
                  <td><Badge variant={item.specStatus === 'aprovada' ? 'success' : 'warning'}>{item.specStatus === 'em_validacao' ? 'em validação' : item.specStatus}</Badge></td>
                  <td><Button variant="secondary" size="sm" onClick={() => approveDecision(item)}>Aprovar decisão</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Development;
