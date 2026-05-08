import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useApp } from '../context/AppContext';
import PageHeader from '../components/ui/PageHeader';
import KanbanBoard from '../components/ui/KanbanBoard';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Textarea from '../components/ui/Textarea';
import { buildTaskPrompt, deriveDiscoveryKnowledge, getDeveloperBacklog } from '../services/operationalWorkflow';

const columns = [
  { id: 'todo', title: 'A fazer' },
  { id: 'in_progress', title: 'Em andamento' },
  { id: 'review', title: 'Validação' },
  { id: 'done', title: 'Concluído' },
  { id: 'blocked', title: 'Bloqueado' },
];

const Backlog = () => {
  const { backlog, updateBacklog, projects, discoveries, addWorkflowRun, addLearningEvent } = useData();
  const { user, addNotification } = useApp();
  const [selectedTask, setSelectedTask] = useState(null);
  const [promptTask, setPromptTask] = useState(null);

  const devBacklog = useMemo(() => getDeveloperBacklog(backlog, projects, user), [backlog, projects, user]);
  const discoveryKnowledge = useMemo(() => deriveDiscoveryKnowledge(discoveries), [discoveries]);

  const getProject = (task) => projects.find(project => project.id === task.projectId);
  const getDiscovery = (task) => discoveryKnowledge.find(item => item.clientName === getProject(task)?.client);

  const startTask = (task) => {
    setPromptTask(task);
    updateBacklog(task.id, { status: 'in_progress', automationMode: 'manual_prompt_ready' });
  };

  const approvePrompt = (mode) => {
    const prompt = buildTaskPrompt(promptTask, getProject(promptTask), getDiscovery(promptTask));
    updateBacklog(promptTask.id, { automationMode: mode, promptApprovedAt: new Date().toISOString(), executionPrompt: prompt });
    addWorkflowRun({
      projectId: promptTask.projectId,
      taskId: promptTask.id,
      requested_by: user?.id,
      agent: 'DEV_SDD',
      mode,
      status: mode === 'kentauros_auto' ? 'pending_approval' : 'external_prompt_ready',
      input_context: { prompt, task: promptTask },
      output_artifacts: {},
      approval_status: 'pending',
      started_at: mode === 'kentauros_auto' ? new Date().toISOString() : null,
    });
    addLearningEvent({
      source: 'backlog',
      event_type: 'task_execution_prompt_approved',
      title: promptTask.title,
      content: prompt,
      project_id: String(promptTask.projectId),
      tags: ['Backlog', 'SDD', mode],
      metadata: { taskId: promptTask.id, mode },
    });
    addNotification('Atividade liberada', mode === 'kentauros_auto' ? 'Fluxo automático preparado para o ecossistema Kentauros.' : 'Prompt liberado para uso em IA externa.', 'success');
    setPromptTask(null);
  };

  return (
    <div className="backlog-page animate-fade-in">
      <PageHeader
        title="Backlog do DEV"
        subtitle={`Atividades aceitas para ${user?.email || 'desenvolvedor'} com prompt de execução pré-pronto.`}
        actions={<Button variant="secondary" onClick={() => addNotification('Sprint planning', 'Backlog organizado por projeto, ordem e responsável.', 'info')}>Sprint planning</Button>}
      />

      <KanbanBoard columns={columns} data={devBacklog} onCardClick={setSelectedTask} />

      <Modal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} title={selectedTask?.title} actions={<Button variant="secondary" onClick={() => setSelectedTask(null)}>Fechar</Button>}>
        {selectedTask && (
          <div className="task-details">
            <div className="grid grid-2 mb-lg">
              <div>
                <label className="text-xs text-muted block mb-xs">Status</label>
                <Badge variant="accent">{selectedTask.status}</Badge>
              </div>
              <div>
                <label className="text-xs text-muted block mb-xs">Projeto</label>
                <div>{selectedTask.project}</div>
              </div>
            </div>
            <div className="mb-lg">
              <label className="text-xs text-muted block mb-xs">Descricao</label>
              <div className="text-sm text-secondary">{selectedTask.description || 'Atividade gerada a partir do projeto aceito.'}</div>
            </div>
            <div className="flex gap-sm">
              <Button variant="primary" onClick={() => startTask(selectedTask)}>Retirar do backlog</Button>
              <Button variant="secondary" onClick={() => updateBacklog(selectedTask.id, { status: 'review' })}>Enviar para validação</Button>
              <Button variant="secondary" onClick={() => updateBacklog(selectedTask.id, { status: 'done' })}>Concluir</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!promptTask}
        onClose={() => setPromptTask(null)}
        title="Prompt antes de iniciar"
        actions={
          <>
            <Button variant="secondary" onClick={() => approvePrompt('external_ai')}>Usar IA externa</Button>
            <Button variant="primary" onClick={() => approvePrompt('kentauros_auto')}>Modo automático Kentauros</Button>
          </>
        }
      >
        {promptTask && (
          <Textarea
            label="Prompt gerado"
            rows={12}
            value={buildTaskPrompt(promptTask, getProject(promptTask), getDiscovery(promptTask))}
            readOnly
          />
        )}
      </Modal>
    </div>
  );
};

export default Backlog;
