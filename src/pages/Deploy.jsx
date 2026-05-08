import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useApp } from '../context/AppContext';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { getDeployReadiness } from '../services/operationalWorkflow';
import { buildProjectVersion } from '../services/deliveryDocuments';

const Deploy = () => {
  const { deployments, projects, backlog, qaTests, addDeployment, updateProject, addLearningEvent } = useData();
  const { addNotification } = useApp();
  const readiness = useMemo(() => getDeployReadiness(deployments, projects, backlog, qaTests), [deployments, projects, backlog, qaTests]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [gitUrl, setGitUrl] = useState('');

  const startDeploy = (item) => {
    if (!item.canDeploy) {
      addNotification('Deploy bloqueado', 'O projeto precisa de QA aprovado antes do deploy.', 'error');
      return;
    }

    addDeployment({
      projectId: item.id,
      env: 'staging',
      version: `v${Date.now()}`,
      status: 'success',
      deployedAt: new Date().toISOString(),
      duration: '3m 10s',
      deployedBy: 'Kentauros AI',
      notes: 'Deploy executado após validação do DEV.',
    });
    updateProject(item.id, {
      status: 'active',
      lastDeployAt: new Date().toISOString(),
      deployVersion: `v${Date.now()}`,
      versions: [
        ...(projects.find(project => project.id === item.id)?.versions || []),
        buildProjectVersion({
          project: projects.find(project => project.id === item.id) || { id: item.id, status: 'active' },
          label: 'Deploy staging aprovado',
          source: 'deploy',
          metadata: { env: 'staging', qaApproved: item.qaApproved, qaTotal: item.qaTotal },
        }),
      ],
    });
    addLearningEvent({
      source: 'deploy',
      event_type: 'deploy_completed',
      title: `Deploy - ${item.project}`,
      content: 'Deploy executado após QA aprovado e validação do DEV.',
      project_id: String(item.id),
      tags: ['Deploy', 'Release'],
      metadata: { env: 'staging', projectId: item.id },
    });
    addNotification('Deploy registrado', 'Pacote publicado com rastreabilidade do fluxo inteligente.', 'success');
  };

  const saveGit = () => {
    const currentProject = projects.find(project => project.id === selectedProject.id) || { id: selectedProject.id };
    updateProject(selectedProject.id, {
      gitRepository: gitUrl,
      gitBranch: 'main',
      gitLinkedAt: new Date().toISOString(),
      versions: [
        ...(currentProject.versions || []),
        buildProjectVersion({
          project: { ...currentProject, gitRepository: gitUrl },
          label: 'Repositorio Git vinculado',
          source: 'git',
          metadata: { gitUrl },
        }),
      ],
    });
    addLearningEvent({
      source: 'deploy',
      event_type: 'git_repository_linked',
      title: `Git vinculado - ${selectedProject.project}`,
      content: gitUrl,
      project_id: String(selectedProject.id),
      tags: ['Git', 'Deploy'],
      metadata: { projectId: selectedProject.id, gitUrl },
    });
    addNotification('Git vinculado', 'Repositorio associado ao projeto.', 'success');
    setSelectedProject(null);
  };

  const downloadPackage = (item) => {
    const projectTasks = backlog.filter(task => task.projectId === item.id);
    const projectQa = qaTests.filter(test => test.projectId === item.id);
    const manifest = {
      project: item.project,
      client: item.client,
      generatedAt: new Date().toISOString(),
      gitRepository: item.gitRepository || null,
      qa: { approved: item.qaApproved, total: item.qaTotal },
      tasks: projectTasks.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        prompt: task.executionPrompt || '',
        qaApproval: task.qaApproval || 'pending',
      })),
      evidence: projectQa.map(test => ({
        id: test.id,
        title: test.title,
        status: test.status,
        documentation: test.documentation,
      })),
    };
    const readme = [
      `# ${item.project}`,
      '',
      `Cliente: ${item.client}`,
      `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
      '',
      '## Passos realizados',
      ...manifest.tasks.map(task => `- ${task.title}: ${task.status}`),
      '',
      '## QA',
      ...manifest.evidence.map(test => `- ${test.title}: ${test.status}`),
      '',
      '## Proximos passos',
      '- Validar localmente.',
      '- Vincular o repositorio Git se ainda nao estiver associado.',
      '- Executar deploy apos QA aprovado.',
    ].join('\n');
    const blob = new Blob([`${readme}\n\n--- manifest.json ---\n${JSON.stringify(manifest, null, 2)}`], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${String(item.project).replace(/\s+/g, '-').toLowerCase()}-kentauros-package.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
    addLearningEvent({
      source: 'deploy',
      event_type: 'project_package_downloaded',
      title: `Pacote baixado - ${item.project}`,
      content: 'Pacote local de validacao gerado com tarefas, QA, manifest e passos de deploy.',
      project_id: String(item.id),
      tags: ['Deploy', 'Package', 'Git'],
      metadata: { projectId: item.id, tasks: projectTasks.length, qa: projectQa.length },
    });
    addNotification('Pacote baixado', 'Arquivo de validacao local gerado com rastreabilidade.', 'success');
  };

  return (
    <div className="deploy-page animate-fade-in">
      <PageHeader
        title="Deploy"
        subtitle="Valide localmente, acompanhe os passos da IA, vincule Git e publique projetos aprovados."
        actions={<Button variant="primary" onClick={() => addNotification('Novo deploy', 'Selecione um projeto aprovado para iniciar.', 'info')}>Novo deploy</Button>}
      />

      <div className="grid grid-3">
        <div className="col-span-2">
          <Card title="Projetos prontos para deploy">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Projeto</th>
                    <th>Atividades</th>
                    <th>QA</th>
                    <th>Git</th>
                    <th>Status</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {readiness.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="font-bold">{item.project}</div>
                        <div className="text-xs text-muted">{item.client}</div>
                      </td>
                      <td>{item.activities}</td>
                      <td>{item.qaApproved}/{item.qaTotal}</td>
                      <td className="text-xs text-muted">{item.gitRepository || 'Nao vinculado'}</td>
                      <td><Badge variant={item.canDeploy ? 'success' : 'warning'}>{item.canDeploy ? 'Liberado' : 'Aguardando QA'}</Badge></td>
                      <td>
                        <div className="flex gap-xs">
                          <Button variant="secondary" size="sm" onClick={() => { setSelectedProject(item); setGitUrl(item.gitRepository || ''); }}>Git</Button>
                          <Button variant="secondary" size="sm" onClick={() => downloadPackage(item)}>Baixar</Button>
                          <Button variant="primary" size="sm" onClick={() => startDeploy(item)}>Deploy</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-lg">
          <Card title="Passos do desenvolvimento inteligente">
            <div className="flex flex-col gap-sm">
              {['Spec SDD aprovada', 'Código gerado', 'QA validado', 'Pacote gerado', 'Git vinculado', 'Deploy liberado'].map(step => (
                <div key={step} className="flex justify-between items-center py-sm" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <span className="text-sm">{step}</span>
                  <Badge variant="secondary">check</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Ambientes">
            <div className="flex flex-col gap-sm">
              <div className="flex justify-between"><strong>Production</strong><Badge variant="success">Healthy</Badge></div>
              <div className="flex justify-between"><strong>Staging</strong><Badge variant="success">Ready</Badge></div>
              <div className="flex justify-between"><strong>Dev/Feature</strong><Badge variant="warning">Building</Badge></div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        title={`Vincular Git - ${selectedProject?.project}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setSelectedProject(null)}>Cancelar</Button>
            <Button variant="primary" onClick={saveGit}>Salvar Git</Button>
          </>
        }
      >
        <Input label="Repositorio Git" value={gitUrl} onChange={event => setGitUrl(event.target.value)} placeholder="https://github.com/org/projeto" />
      </Modal>
    </div>
  );
};

export default Deploy;
