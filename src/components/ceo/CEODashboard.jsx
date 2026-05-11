import React, { useState, useEffect } from 'react';
import { ceoService, AGENT_ROLES, AGENT_STATUS } from '../../services/ceo/ceoService';
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { Bot, Users, FileText, CheckCircle, AlertTriangle, Clock, Zap } from 'lucide-react';
import './CEODashboard.css';

const AgentCard = ({ agent, onSelect }) => {
  const statusColors = {
    [AGENT_STATUS.IDLE]: 'secondary',
    [AGENT_STATUS.HIRED]: 'accent',
    [AGENT_STATUS.WORKING]: 'warning',
    [AGENT_STATUS.APPROVED]: 'success',
    [AGENT_STATUS.REJECTED]: 'danger',
  };

  return (
    <Card hoverable onClick={() => onSelect(agent)}>
      <div className="flex items-center gap-3 mb-3">
        <div className="agent-icon" data-role={agent.role.toLowerCase()}>
          <Bot size={20} />
        </div>
        <div>
          <strong>{agent.role}</strong>
          <Badge variant={statusColors[agent.status]} size="sm">{agent.status}</Badge>
        </div>
      </div>
      <div className="text-xs text-muted">
        <div>{agent.tasks?.length || 0} tarefas</div>
        <div>{agent.documentation?.length || 0} docs</div>
      </div>
    </Card>
  );
};

const CEODashboard = ({ projectId, project, onClose }) => {
  const [agents, setAgents] = useState([]);
  const [projectAgents, setProjectAgents] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isHiringModalOpen, setIsHiringModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    if (projectId) {
      const status = ceoService.getAgentStatus(projectId);
      setProjectAgents(status.agents || []);
      setPendingApprovals(ceoService.getPendingApprovals().filter(a =>
        a.agentKey?.startsWith(`${projectId}-`)
      ));
    }

    const unsubscribe = ceoService.subscribe((event) => {
      if (event.event === 'agent_hired' || event.event === 'agent_installed') {
        setProjectAgents(ceoService.getAgentStatus(projectId)?.agents || []);
      }
      if (event.event === 'approval_requested') {
        setPendingApprovals(ceoService.getPendingApprovals());
      }
      if (event.event === 'log') {
        setLogs(prev => [event.data, ...prev].slice(0, 20));
      }
    });

    return () => unsubscribe();
  }, [projectId]);

  const handleHireAgent = async (role) => {
    try {
      await ceoService.hireAgent(projectId, role);
      const status = ceoService.getAgentStatus(projectId);
      setProjectAgents(status.agents || []);
      setIsHiringModalOpen(false);
    } catch (err) {
      console.error('Erro ao contratar agente:', err);
    }
  };

  const handleInstallAgent = async (role) => {
    try {
      await ceoService.installAgent(projectId, role);
      const status = ceoService.getAgentStatus(projectId);
      setProjectAgents(status.agents || []);
    } catch (err) {
      console.error('Erro ao instalar agente:', err);
    }
  };

  const handleApprove = async (approvalId) => {
    await ceoService.approveWork(approvalId, 'dev-user');
    setPendingApprovals(ceoService.getPendingApprovals().filter(a =>
      a.agentKey?.startsWith(`${projectId}-`)
    ));
  };

  const handleReject = async (approvalId, reason) => {
    await ceoService.rejectWork(approvalId, 'dev-user', reason);
    setPendingApprovals(ceoService.getPendingApprovals().filter(a =>
      a.agentKey?.startsWith(`${projectId}-`)
    ));
  };

  return (
    <div className="ceo-dashboard animate-fade-in">
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <div className="ceo-icon"><Zap size={24} /></div>
            CEO Agent Dashboard
          </div>
        }
        subtitle={`Controlando projeto: ${project?.name || 'Projeto'}`}
        actions={
          <Button variant="primary" onClick={() => setIsHiringModalOpen(true)}>
            <Users size={16} /> Contratar Agente
          </Button>
        }
      />

      <div className="ceo-grid">
        <Card title="Agentes Contratados" icon={<Bot size={18} />}>
          <div className="agents-grid">
            {projectAgents.length === 0 ? (
              <p className="text-muted text-sm">Nenhum agente contratado ainda</p>
            ) : (
              projectAgents.map((agent, index) => (
                <div key={index} className="agent-item">
                  <div className="flex items-center gap-2">
                    <Bot size={16} />
                    <strong>{agent.role}</strong>
                    <Badge variant={agent.status === 'working' ? 'warning' : 'secondary'} size="sm">
                      {agent.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted">{agent.tasksCount} tarefas</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="Aprovações Pendentes" icon={<CheckCircle size={18} />}>
          {pendingApprovals.length === 0 ? (
            <p className="text-muted text-sm">Nenhuma aprovação pendente</p>
          ) : (
            <div className="approvals-list">
              {pendingApprovals.map((approval) => (
                <div key={approval.id} className="approval-item">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="warning">{approval.agentRole}</Badge>
                    <span className="text-xs text-muted">{approval.work?.title || 'Trabalho sem título'}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" onClick={() => handleApprove(approval.id)}>
                      Aprovar
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleReject(approval.id, 'Revisar e ajustar')}>
                      Rejeitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Logs do CEO" icon={<FileText size={18} />}>
          <div className="ceo-logs">
            {logs.length === 0 ? (
              <p className="text-muted text-sm">Aguardando atividades...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`log-item log-${log.level}`}>
                  <span className="log-time">{new Date(log.timestamp || Date.now()).toLocaleTimeString()}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="Contratar Novo Agente" icon={<Users size={18} />}>
          <div className="hire-grid">
            {Object.values(AGENT_ROLES).filter(r => r !== 'CEO').map((role) => {
              const isHired = projectAgents.some(a => a.role === role);
              return (
                <div key={role} className="hire-item">
                  <div className="flex items-center gap-2">
                    <Bot size={16} />
                    <span>{role}</span>
                  </div>
                  <Button
                    variant={isHired ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => isHired ? handleInstallAgent(role) : handleHireAgent(role)}
                  >
                    {isHired ? 'Instalar' : 'Contratar'}
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isHiringModalOpen}
        onClose={() => setIsHiringModalOpen(false)}
        title="Contratar Novo Agente"
        actions={<Button variant="secondary" onClick={() => setIsHiringModalOpen(false)}>Fechar</Button>}
      >
        <div className="hire-agents-list">
          <p className="text-sm text-muted mb-4">Selecione o tipo de agente para contratar:</p>
          {Object.values(AGENT_ROLES).filter(r => r !== 'CEO').map((role) => (
            <div key={role} className="hire-agent-row">
              <div className="flex items-center gap-3">
                <Bot size={20} />
                <div>
                  <strong>{role}</strong>
                  <p className="text-xs text-muted">{ceoService.getAgentInstallSteps(role).length} passos de instalação</p>
                </div>
              </div>
              <Button variant="primary" onClick={() => { handleHireAgent(role); setIsHiringModalOpen(false); }}>
                Contratar
              </Button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default CEODashboard;