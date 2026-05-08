import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useApp } from '../context/AppContext';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import StatCard from '../components/ui/StatCard';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { getQaValidationItems } from '../services/operationalWorkflow';
import { buildQaEvidenceDocument, downloadTextFile, renderQaEvidenceText } from '../services/deliveryDocuments';

const statusType = (status) => {
  if (status === 'passed') return 'success';
  if (status === 'failed') return 'danger';
  return 'warning';
};

const QA = () => {
  const { qaTests, projects, backlog, updateQaTest, updateBacklog, addQaTest, addLearningEvent } = useData();
  const { addNotification } = useApp();
  const [selectedItem, setSelectedItem] = useState(null);
  const validationItems = useMemo(() => getQaValidationItems(qaTests, backlog, projects), [qaTests, backlog, projects]);

  const approveDelivery = (item) => {
    const evidenceDocument = buildQaEvidenceDocument({ item: { ...item, status: 'passed' }, projectName: item.projectName });
    const evidence = [
      'Criterios de aceite revisados',
      'Fluxo principal testado em staging',
      'Documentacao de entrega gerada',
    ];
    if (String(item.id).startsWith('task-')) {
      const taskId = Number(String(item.id).replace('task-', ''));
      updateBacklog(taskId, { qaApproval: 'approved', status: 'done', qaEvidence: evidence, qaEvidenceDocument: evidenceDocument, documentationGeneratedAt: new Date().toISOString() });
    } else {
      updateQaTest(item.id, { status: 'passed', developerApproval: 'approved', executedAt: new Date().toISOString().split('T')[0], evidence, evidenceDocument, documentationGeneratedAt: new Date().toISOString() });
    }
    addLearningEvent({
      source: 'qa',
      event_type: 'qa_delivery_approved',
      title: item.title,
      content: item.documentation || 'Entrega validada com testes e documentacao.',
      project_id: String(item.projectId || ''),
      tags: ['QA', 'Approval'],
      metadata: { qaId: item.id, status: 'passed', evidenceDocumentId: evidenceDocument.id },
    });
    addNotification('QA aprovado', 'Entrega validada com testes e documentacao.', 'success');
    setSelectedItem(null);
  };

  const downloadEvidence = (item) => {
    const evidenceDocument = item.evidenceDocument || buildQaEvidenceDocument({ item, projectName: item.projectName });
    downloadTextFile(`${String(item.title).replace(/\s+/g, '-').toLowerCase()}-qa-evidencias.md`, renderQaEvidenceText(evidenceDocument));
    addLearningEvent({
      source: 'qa',
      event_type: 'qa_evidence_downloaded',
      title: item.title,
      content: 'Documento de evidencias QA baixado pelo usuario.',
      project_id: String(item.projectId || ''),
      tags: ['QA', 'Document'],
      metadata: { qaId: item.id },
    });
  };

  const rejectDelivery = (item) => {
    const reason = 'Reprovado pelo DEV: ajustar implementacao antes de novo QA.';
    if (String(item.id).startsWith('task-')) {
      const taskId = Number(String(item.id).replace('task-', ''));
      updateBacklog(taskId, { qaApproval: 'rejected', status: 'in_progress', qaRejectedAt: new Date().toISOString(), qaRejectionReason: reason });
    } else {
      updateQaTest(item.id, { status: 'failed', developerApproval: 'rejected', rejectionReason: reason, executedAt: new Date().toISOString().split('T')[0] });
      if (item.taskId) updateBacklog(item.taskId, { status: 'in_progress', qaApproval: 'rejected', qaRejectionReason: reason });
    }
    addLearningEvent({
      source: 'qa',
      event_type: 'qa_delivery_rejected',
      title: item.title,
      content: reason,
      project_id: String(item.projectId || ''),
      tags: ['QA', 'Rework', 'DEV'],
      metadata: { qaId: item.id, status: 'failed' },
    });
    addNotification('QA reprovado', 'Entrega voltou para desenvolvimento com motivo registrado.', 'error');
    setSelectedItem(null);
  };

  const runAutomatedSuite = () => {
    const reviewTasks = backlog.filter(task => task.status === 'review' && !qaTests.some(test => test.taskId === task.id));
    reviewTasks.forEach(task => {
      addQaTest({
        projectId: task.projectId,
        taskId: task.id,
        title: `Teste automatizado: ${task.title}`,
        type: 'automated_sdd',
        status: 'pending',
        environment: 'staging',
        documentation: `Validar ${task.title} conforme prompt SDD, criterios do Discovery e evidencias tecnicas.`,
        developerApproval: 'pending',
      });
    });
    addLearningEvent({
      source: 'qa',
      event_type: 'qa_suite_generated',
      title: 'Suite automatizada criada',
      content: `${reviewTasks.length} validacoes geradas para tarefas em revisao.`,
      tags: ['QA', 'Automation', 'SDD'],
      metadata: { generated: reviewTasks.length },
    });
    addNotification('Suite QA executada', `${reviewTasks.length} validacoes automatizadas foram preparadas.`, 'success');
  };

  return (
    <div className="qa-page animate-fade-in">
      <PageHeader
        title="Controle de Qualidade"
        subtitle="Validação das atividades desenvolvidas pela IA, testes executados e documentação gerada."
        actions={<Button variant="primary" onClick={runAutomatedSuite}>Executar suite</Button>}
      />

      <div className="grid grid-4 mb-xl">
        <StatCard label="Validações" value={validationItems.length} />
        <StatCard label="Aprovadas" value={validationItems.filter(item => item.status === 'passed').length} />
        <StatCard label="Pendentes" value={validationItems.filter(item => item.status === 'pending').length} />
        <StatCard label="Com falha" value={validationItems.filter(item => item.status === 'failed').length} />
      </div>

      <Card title="Entregas automatizadas para aprovação">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Entrega/Teste</th>
                <th>Projeto</th>
                <th>Status</th>
                <th>Documentação</th>
                <th>Ambiente</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {validationItems.map(item => (
                <tr key={item.id}>
                  <td>
                    <div className="font-bold">{item.title}</div>
                    <div className="text-xs text-muted">{String(item.type).toUpperCase()}</div>
                  </td>
                  <td>{item.projectName}</td>
                  <td><Badge variant={statusType(item.status)}>{item.status}</Badge></td>
                  <td className="text-xs text-muted">{item.documentation || 'Evidências e documentação de entrega disponíveis.'}</td>
                  <td>{String(item.environment || 'staging').toUpperCase()}</td>
                  <td>
                    <div className="flex gap-xs">
                      <Button variant="secondary" size="sm" onClick={() => setSelectedItem(item)}>Validar</Button>
                      <Button variant="secondary" size="sm" onClick={() => downloadEvidence(item)}>Doc</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.title}
        actions={
          <>
            <Button variant="secondary" onClick={() => setSelectedItem(null)}>Fechar</Button>
            <Button variant="danger" onClick={() => rejectDelivery(selectedItem)}>Reprovar entrega</Button>
            <Button variant="primary" onClick={() => approveDelivery(selectedItem)}>Aprovar entrega</Button>
          </>
        }
      >
        {selectedItem && (
          <div className="flex flex-col gap-md">
            <div>
              <div className="text-xs text-muted">Teste realizado</div>
              <p className="text-sm text-secondary">Fluxo validado no ambiente {selectedItem.environment || 'staging'} com evidencias anexadas ao registro.</p>
            </div>
            <div>
              <div className="text-xs text-muted">Documentação gerada</div>
              <p className="text-sm text-secondary">{selectedItem.documentation || 'Documento de entrega, criterios de aceite e evidencias tecnicas.'}</p>
            </div>
            <pre className="text-xs bg-secondary p-md border-radius-sm" style={{ whiteSpace: 'pre-wrap' }}>
{`[QA] Projeto: ${selectedItem.projectName}
[TESTE] ${selectedItem.title}
[STATUS] ${selectedItem.status}
[EVIDENCIA] Logs, criterios de aceite e documentacao revisados pelo DEV.
[DOCUMENTACAO] Evidencias anexadas para entrega e historico de auditoria.`}
            </pre>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default QA;
