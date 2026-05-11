import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { aiService } from '../services/ai/aiService';
import { ceoService } from '../services/ceo/ceoService';
import { leadCaptureService } from '../services/leads/leadCaptureService';
import { meetingAgentService } from '../services/meetings/meetingAgentService';
import { projectSegmentationService } from '../services/segmentation/projectSegmentationService';
import { testPipelineService } from '../services/testing/testPipelineService';
import { documentationService } from '../services/documentation/documentationService';
import {
  TrendingUp,
  Users,
  Target,
  Clock,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
  Bot,
  FileText,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, change, trend, color = 'gold' }) => (
  <Card className={`stat-card stat-${color}`}>
    <div className="stat-icon">
      <Icon size={24} />
    </div>
    <div className="stat-content">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {change && (
        <span className={`stat-change ${trend}`}>
          {trend === 'up' ? <ArrowUp size={12} /> : trend === 'down' ? <ArrowDown size={12} /> : <Minus size={12} />}
          {change}
        </span>
      )}
    </div>
  </Card>
);

const SmartAnalytics = () => {
  const { leads, projects, backlog, qaTests, discoveries, proposals } = useData();
  const [logs, setLogs] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    const unsubscribe = aiService.subscribe((newLogs) => {
      setLogs(newLogs.slice(0, 50));
    });

    aiService.addLog('CEO', 'Dashboard de Analytics carregado', 'info');

    return () => unsubscribe();
  }, []);

  const metrics = useMemo(() => {
    const now = new Date();
    const periodDays = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const leadsInPeriod = leads.filter(l => new Date(l.createdAt || l.created_at) >= periodStart);
    const wonLeads = leads.filter(l => l.status === 'won');
    const qualifiedLeads = leads.filter(l => ['qualified', 'discovery', 'proposal'].includes(l.status));

    const activeProjects = projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled');
    const completedProjects = projects.filter(p => p.status === 'completed');

    const pendingTasks = backlog.filter(t => t.status === 'todo' || t.status === 'in_progress');
    const completedTasks = backlog.filter(t => t.status === 'done');

    const pendingQA = qaTests.filter(q => q.status === 'pending' || q.status === 'in_progress');

    const conversionRate = leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : 0;
    const avgDealValue = wonLeads.length > 0
      ? wonLeads.reduce((sum, l) => sum + (Number(l.value) || 0), 0) / wonLeads.length
      : 0;

    return {
      leads: {
        total: leads.length,
        new: leadsInPeriod.length,
        won: wonLeads.length,
        qualified: qualifiedLeads.length,
        conversionRate,
        avgDealValue,
      },
      projects: {
        total: projects.length,
        active: activeProjects.length,
        completed: completedProjects.length,
        totalValue: projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0),
      },
      tasks: {
        total: backlog.length,
        pending: pendingTasks.length,
        completed: completedTasks.length,
        completionRate: backlog.length > 0 ? Math.round((completedTasks.length / backlog.length) * 100) : 0,
      },
      qa: {
        pending: pendingQA.length,
        total: qaTests.length,
      },
      discoveries: {
        total: discoveries.length,
        approved: discoveries.filter(d => d.status === 'approved').length,
      },
      proposals: {
        total: proposals.length,
        sent: proposals.filter(p => p.status === 'sent').length,
        approved: proposals.filter(p => ['approved', 'signed', 'won'].includes(p.status)).length,
      },
    };
  }, [leads, projects, backlog, qaTests, discoveries, proposals, selectedPeriod]);

  const pipelineData = useMemo(() => {
    const stages = [
      { name: 'Novos', count: leads.filter(l => l.status === 'new').length, value: leads.filter(l => l.status === 'new').reduce((s, l) => s + (Number(l.value) || 0), 0) },
      { name: 'Qualificados', count: leads.filter(l => l.status === 'qualified').length, value: leads.filter(l => l.status === 'qualified').reduce((s, l) => s + (Number(l.value) || 0), 0) },
      { name: 'Discovery', count: leads.filter(l => l.status === 'discovery').length, value: leads.filter(l => l.status === 'discovery').reduce((s, l) => s + (Number(l.value) || 0), 0) },
      { name: 'Proposta', count: leads.filter(l => l.status === 'proposal').length, value: leads.filter(l => l.status === 'proposal').reduce((s, l) => s + (Number(l.value) || 0), 0) },
      { name: 'Ganhos', count: leads.filter(l => l.status === 'won').length, value: leads.filter(l => l.status === 'won').reduce((s, l) => s + (Number(l.value) || 0), 0) },
    ];
    return stages;
  }, [leads]);

  const agentPerformance = useMemo(() => {
    return [
      { agent: 'CEO', tasks: logs.filter(l => l.agentId === 'CEO').length, status: 'active' },
      { agent: 'BA', tasks: logs.filter(l => l.agentId === 'BA').length, status: 'active' },
      { agent: 'UX', tasks: logs.filter(l => l.agentId === 'UX').length, status: 'active' },
      { agent: 'DEV', tasks: logs.filter(l => l.agentId === 'DEV').length, status: 'active' },
      { agent: 'QA', tasks: logs.filter(l => l.agentId === 'QA').length, status: 'active' },
    ];
  }, [logs]);

  return (
    <div className="analytics-page animate-fade-in">
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <BarChart3 className="text-gold" size={28} />
            Smart Analytics
          </div>
        }
        subtitle="Inteligência analítica do ecossistema Kentauros"
        actions={
          <div className="flex gap-2">
            {['7d', '30d', '90d'].map(period => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
              >
                {period}
              </Button>
            ))}
          </div>
        }
      />

      <div className="analytics-grid">
        <div className="stats-row">
          <StatCard icon={Users} label="Total Leads" value={metrics.leads.total} change={`+${metrics.leads.new} novos`} trend="up" />
          <StatCard icon={Target} label="Taxa Conversão" value={`${metrics.leads.conversionRate}%`} color="green" />
          <StatCard icon={TrendingUp} label="Ticket Médio" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.leads.avgDealValue)} color="blue" />
          <StatCard icon={CheckCircle} label="Propostas Aprovadas" value={metrics.proposals.approved} color="green" />
        </div>

        <div className="stats-row">
          <StatCard icon={Activity} label="Projetos Ativos" value={metrics.projects.active} change={`${metrics.projects.completed} concluídos`} />
          <StatCard icon={FileText} label="Tarefas Pendentes" value={metrics.tasks.pending} color="orange" />
          <StatCard icon={Zap} label="Discoveries" value={metrics.discoveries.total} change={`${metrics.discoveries.approved} aprovados`} trend="up" />
          <StatCard icon={AlertTriangle} label="QA Pendente" value={metrics.qa.pending} color="red" />
        </div>

        <Card title="Pipeline de Vendas" className="pipeline-card">
          <div className="pipeline-stages">
            {pipelineData.map((stage, index) => (
              <div key={stage.name} className="pipeline-stage">
                <div className="pipeline-bar-container">
                  <div
                    className="pipeline-bar"
                    style={{
                      height: `${Math.max(20, (stage.count / Math.max(...pipelineData.map(s => s.count || 1))) * 100)}%`,
                      backgroundColor: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#22c55e'][index],
                    }}
                  />
                </div>
                <div className="pipeline-info">
                  <span className="pipeline-count">{stage.count}</span>
                  <span className="pipeline-name">{stage.name}</span>
                  <span className="pipeline-value">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(stage.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Performance dos Agentes IA" className="agents-card">
          <div className="agents-list">
            {agentPerformance.map(agent => (
              <div key={agent.agent} className="agent-row">
                <div className="agent-info">
                  <Bot size={16} className="text-gold" />
                  <span className="agent-name">{agent.agent}</span>
                  <Badge variant="success" size="sm">{agent.status}</Badge>
                </div>
                <div className="agent-stats">
                  <span className="agent-tasks">{agent.tasks} logs</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Métricas de Projetos" className="projects-metrics">
          <div className="metrics-grid">
            <div className="metric-item">
              <span className="metric-label">Valor Total em Projetos</span>
              <span className="metric-value">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(metrics.projects.totalValue)}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Taxa de Conclusão</span>
              <span className="metric-value">{metrics.tasks.completionRate}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Propostas Enviadas</span>
              <span className="metric-value">{metrics.proposals.sent}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Leads Qualificados</span>
              <span className="metric-value">{metrics.leads.qualified}</span>
            </div>
          </div>
        </Card>

        <Card title="Atividade Recente IA" className="activity-card">
          <div className="activity-list">
            {logs.slice(0, 10).map((log, index) => (
              <div key={index} className={`activity-item activity-${log.type}`}>
                <div className="activity-dot" />
                <div className="activity-content">
                  <span className="activity-agent">{log.agentId}</span>
                  <span className="activity-message">{log.message}</span>
                </div>
                <span className="activity-time">{log.timestamp}</span>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-muted text-sm">Aguardando atividades dos agentes...</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SmartAnalytics;