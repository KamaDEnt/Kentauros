import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { buildProjectAcceptancePlan, getSignedReadyProjects, canAccessAdmin } from '../services/operationalWorkflow';
import { buildClientProjectContext, buildApprovalChecklist } from '../services/projectContextBuilder';

const PHASE_ROUTES = {
  'Spec SDD': '/discovery',
  'Backlog': '/backlog',
  'Desenvolvimento': '/kanban',
  'QA': '/qa',
  'Deploy': '/deployments',
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const Projects = () => {
  const {
    projects,
    proposals,
    discoveries,
    backlog,
    leads,
    qaTests,
    deployments,
    learningEvents,
    updateBacklog,
    addBacklog,
    updateProject,
    addProject,
    addWorkflowRun,
    addLearningEvent,
  } = useData();
  const { user, addNotification } = useApp();
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState(null);
  const readyProjects = useMemo(() => getSignedReadyProjects(projects, proposals, discoveries, backlog, leads), [projects, proposals, discoveries, backlog, leads]);

  const progress = (project) => {
    const phases = project.phases || [];
    if (!phases.length) return project.progress || 0;
    return Math.round((phases.filter(phase => phase.status === 'completed').length / phases.length) * 100);
  };

  const selectedContext = selectedProject ? buildClientProjectContext({
    clientName: selectedProject.client,
    lead: leads.find(lead => lead.company === selectedProject.client),
    discovery: selectedProject.discovery,
    proposal: proposals.find(proposal => proposal.clientName === selectedProject.client),
    project: selectedProject,
    backlog,
    qaTests,
    deployments,
    learningEvents,
  }) : null;
  const selectedVersionHistory = selectedProject
    ? (selectedProject.versions?.length ? selectedProject.versions : [{
      id: 'empty',
      label: 'Sem versão registrada',
      source: 'Projeto',
      status: selectedProject.status,
      createdAt: selectedProject.createdAt || selectedProject.acceptedAt,
      description: 'Aguardando primeira versão técnica gerada pelo fluxo de desenvolvimento.',
    }])
    : [];
  const selectedLearningHistory = selectedContext
    ? (selectedContext.learningEvents.length ? selectedContext.learningEvents : [{ id: 'empty', title: 'Nenhum aprendizado vinculado ainda.', source: 'Sistema' }]).slice(0, 6)
    : [];

  const acceptProject = (project) => {
    const plan = buildProjectAcceptancePlan({ project, user, backlog });
    const acceptedAt = new Date().toISOString();
    const projectExists = projects.some(item => String(item.id) === String(project.id));

    plan.updates.forEach(item => updateBacklog(item.id, item.data));
    plan.creates.forEach(task => addBacklog(task));

    const projectPayload = {
      status: 'accepted',
      acceptedByDeveloperId: user?.id,
      acceptedByDeveloperEmail: user?.email,
      acceptedAt,
      team: Array.from(new Set([...(project.team || []), user?.id].filter(Boolean))),
      progress: Math.max(project.progress || 0, 5),
    };

    if (projectExists) {
      updateProject(project.id, projectPayload);
    } else {
      addProject({
        ...project,
        ...projectPayload,
        sourceProposalId: String(project.id).startsWith('proposal-') ? String(project.id).replace('proposal-', '') : project.sourceProposalId,
      });
    }

    addWorkflowRun({
      projectId: project.id,
      requested_by: user?.id,
      agent: 'PROJECT_ACCEPTANCE',
      mode: 'developer_acceptance',
      status: 'backlog_ready',
      input_context: { project, generatedTasks: plan.creates.length, assignedTasks: plan.updates.length },
      output_artifacts: { redirect: '/backlog' },
      approval_status: 'approved',
      started_at: acceptedAt,
    });

    addLearningEvent({
      source: 'project',
      event_type: 'project_accepted_by_developer',
      title: project.name,
      content: `Projeto aceito por ${user?.email || 'DEV'} e encaminhado ao backlog com atividades ordenadas pela IA.`,
      project_id: String(project.id),
      tags: ['Project', 'Backlog', 'DEV'],
      metadata: { project_id: project.id, developer_id: user?.id, generated_tasks: plan.creates.length },
    });

    addNotification('Projeto aceito', 'As atividades foram vinculadas ao seu backlog.', 'success');
    setSelectedProject(null);
    navigate('/backlog');
  };

  return (
    <div className="projects-page animate-fade-in">
      <PageHeader
        title="Projetos"
        subtitle="Projetos assinados, aptos para início e conectados às decisões do Discovery."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary">Linha do tempo</Button>
            <Button variant="primary">Novo projeto</Button>
          </div>
        }
      />

      <div className="grid grid-3">
        {readyProjects.map(project => (
          <Card
            key={project.id}
            hoverable
            onClick={() => setSelectedProject(project)}
            headerActions={<Badge variant="success">{project.readinessTag}</Badge>}
            footer={
              <div className="project-card-actions">
                <Button variant="secondary" size="sm" onClick={(event) => {
                  event.stopPropagation();
                  setSelectedProject(project);
                }}>
                  Ver detalhes
                </Button>
                <Button variant="primary" size="sm" onClick={(event) => {
                  event.stopPropagation();
                  acceptProject(project);
                }}>
                  Aceitar projeto
                </Button>
              </div>
            }
          >
            <h3 className="card-title mt-2">{project.name}</h3>
            <p className="text-sm text-muted mb-4">{project.client}</p>

            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-muted">Progresso operacional</span>
                <span className="text-xs font-bold">{progress(project)}%</span>
              </div>
              <div className="project-progress-bar">
                <div className="project-progress-fill" style={{ width: `${progress(project)}%` }} />
              </div>
            </div>

            <div className="grid grid-2 mb-4">
              <div>
                <div className="text-xs text-muted">Orçamento</div>
                <div className="text-sm font-mono">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.budget || 0)}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Atividades IA</div>
                <div className="text-sm">{project.orderedTasks?.length || 0}</div>
              </div>
            </div>

            <div className="flex gap-1 flex-wrap">
              {(project.tags || []).map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        title={selectedProject?.name}
        size="lg"
        actions={
          <>
            <Button variant="secondary" onClick={() => setSelectedProject(null)}>Fechar</Button>
            <Button variant="primary" onClick={() => acceptProject(selectedProject)}>Aceitar e enviar ao meu backlog</Button>
          </>
        }
      >
        {selectedProject && (
          <div className="project-detail-layout">
            <div className="project-detail-summary">
              <div>
                <div className="text-xs text-muted">Cliente</div>
                <strong>{selectedProject.client}</strong>
              </div>
              <div>
                <div className="text-xs text-muted">Valor aprovado</div>
                <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProject.budget || 0)}</strong>
              </div>
              <div>
                <div className="text-xs text-muted">Atividades separadas pela IA</div>
                <strong>{selectedProject.orderedTasks?.length || 'Será gerado ao aceitar'}</strong>
              </div>
            </div>

            {canAccessAdmin(user) && selectedProject.phases?.length > 0 && (
              <div className="project-detail-section">
                <div className="project-section-title">
                  <span>Fases do Projeto</span>
                  <Badge variant="secondary">{selectedProject.phases.length}</Badge>
                </div>
                <div className="project-phases-grid mt-sm">
                  {selectedProject.phases.map((phase, index) => {
                    const route = PHASE_ROUTES[phase.name];
                    const isPending = phase.status === 'pending';
                    return (
                      <div key={index} className={`project-phase-card ${phase.status === 'completed' ? 'completed' : ''} ${isPending ? 'pending' : ''}`}>
                        <div className="project-phase-header">
                          <span className="project-phase-index">{index + 1}</span>
                          <Badge variant={phase.status === 'completed' ? 'success' : phase.status === 'in_progress' ? 'accent' : 'warning'}>
                            {phase.status === 'completed' ? 'concluído' : phase.status === 'in_progress' ? 'em progresso' : 'pendente'}
                          </Badge>
                        </div>
                        <span className="project-phase-name">{phase.name}</span>
                        {isPending && route && (
                          <Button variant="secondary" size="sm" className="mt-2" onClick={() => navigate(route)}>
                            Acessar tela
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="project-detail-section">
              <div className="project-section-title">
                <span>Decisões registradas no Discovery</span>
              </div>
              <ul className="project-decision-list">
                {(selectedProject.discovery?.decisions || ['Nenhuma decisão vinculada ao Discovery ainda.']).map(decision => (
                  <li key={decision}>{decision}</li>
                ))}
              </ul>
            </div>

            <div className="project-detail-section">
              <div className="project-section-title">
                <span>Atividades em ordem de execução</span>
                <Badge variant="secondary">{selectedProject.orderedTasks?.length || 0}</Badge>
              </div>
              <div className="table-wrapper mt-sm">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Ordem</th>
                      <th>Atividade</th>
                      <th>Status</th>
                      <th>Responsável</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedProject.orderedTasks || []).length ? (selectedProject.orderedTasks || []).map((task, index) => (
                      <tr key={task.id}>
                        <td>{index + 1}</td>
                        <td>{task.title}</td>
                        <td><Badge variant="secondary">{task.status}</Badge></td>
                        <td>{task.assigneeEmail || task.assignee || 'DEV'}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="project-empty-row">As atividades serão separadas pela IA ao aceitar o projeto.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="project-detail-section">
              <div className="project-section-title">
                <span>Checklist de aprovação do projeto</span>
              </div>
              <div className="project-checklist-grid">
                {buildApprovalChecklist('project', selectedContext).map(item => (
                  <div key={item.label} className="project-checklist-item">
                    <span>{item.label}</span>
                    <Badge variant={item.completed ? 'success' : 'warning'}>{item.completed ? 'ok' : 'pendente'}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="project-history-panel">
              <div className="project-section-title">
                <span>Histórico de versões e decisões</span>
                <Badge variant="secondary">{selectedVersionHistory.length}</Badge>
              </div>
              <div className="project-history-grid mt-sm">
                {selectedVersionHistory.map((version, index) => (
                  <article key={`${version.id}-${index}`} className="project-history-card">
                    <div className="project-history-card-head">
                      <span className="project-history-index">{String(index + 1).padStart(2, '0')}</span>
                      <Badge variant={version.status === 'ready' || version.status === 'accepted' ? 'success' : 'secondary'}>{version.status || '-'}</Badge>
                    </div>
                    <strong>{version.label}</strong>
                    <p>{version.description || version.source || 'Registro operacional do projeto.'}</p>
                    <div className="project-history-meta">
                      <span>{version.source || 'Sistema'}</span>
                      <span>{formatDateTime(version.createdAt)}</span>
                    </div>
                  </article>
                ))}
              </div>

              <div className="project-section-title mt-md">
                <span>Aprendizados recentes vinculados</span>
                <Badge variant="secondary">{selectedLearningHistory.length}</Badge>
              </div>
              <div className="project-learning-grid mt-sm">
                {selectedLearningHistory.map((event, index) => (
                  <div key={`${event.id}-${index}`} className="project-learning-item">
                    <span className="project-learning-dot" />
                    <div>
                      <strong>{event.title}</strong>
                      <p>{event.content || event.source || 'Aprendizado registrado no ecossistema.'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Projects;
