import React, { useState } from 'react';
import { useLogs } from '../context/LogsContext';
import { useData } from '../context/DataContext';
import { useI18n } from '../context/I18nContext';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const SmartLogs = () => {
  const { systemLogs, incidents, analyzeIncidentWithAI } = useLogs();
  const { learningEvents, workflowRuns, approvalRequests, deployments, addLearningEvent, addBacklog } = useData();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('incidents'); // 'incidents' | 'logs'
  const [analyzingId, setAnalyzingId] = useState(null);

  const handleAnalyze = (id) => {
    setAnalyzingId(id);
    setTimeout(() => {
      analyzeIncidentWithAI(id);
      const incident = incidents.find(item => item.id === id);
      addLearningEvent({
        source: 'logs',
        event_type: 'incident_analyzed',
        title: incident?.title || `Incidente ${id}`,
        content: 'Incidente analisado pela IA e registrado para aprendizado continuo.',
        tags: ['Logs', 'Incident', 'Learning'],
        metadata: { incidentId: id, severity: incident?.severity },
      });
      setAnalyzingId(null);
    }, 1500);
  };

  const createTechCard = (incident) => {
    addBacklog({
      title: `Corrigir incidente: ${incident.title}`,
      description: incident.analysis?.suggestion || 'Investigar causa raiz, impacto e ajuste preventivo.',
      status: 'todo',
      priority: incident.severity === 'high' ? 'critical' : 'high',
      assignee: null,
      projectId: null,
      tags: ['incident', 'observability', 'learning'],
      automationMode: 'pre_ready',
    });
    addLearningEvent({
      source: 'logs',
      event_type: 'incident_task_created',
      title: incident.title,
      content: 'Card tecnico criado a partir de analise de incidente.',
      tags: ['Backlog', 'Observability'],
      metadata: { incidentId: incident.id },
    });
  };

  const continuousSignals = [
    { label: 'Eventos de aprendizado', value: learningEvents.length },
    { label: 'Runs automatizados', value: workflowRuns.length },
    { label: 'Aprovacoes pendentes', value: approvalRequests.filter(item => item.status === 'pending').length },
    { label: 'Deploys com falha', value: deployments.filter(item => ['failed', 'error'].includes(item.status)).length },
  ];

  const getLevelBadge = (level) => {
    switch(level) {
      case 'critical': return 'danger';
      case 'error': return 'danger';
      case 'warning': return 'warning';
      case 'info': return 'primary';
      default: return 'secondary';
    }
  };

  return (
    <div className="smartlogs-page animate-fade-in">
      <PageHeader 
        title={t('smartlogs.title') || 'Smart Logs'} 
        subtitle={t('smartlogs.subtitle') || 'AI-powered log analysis and incident tracking.'} 
      />

      <div className="grid grid-4 mb-xl">
        {continuousSignals.map(signal => (
          <Card key={signal.label}>
            <div className="text-xs text-muted">{signal.label}</div>
            <div className="font-bold text-lg mt-xs">{signal.value}</div>
          </Card>
        ))}
      </div>

      <div className="tabs flex gap-4 mb-6 border-b border-[var(--border-color)]">
        <button 
          className={`pb-2 px-4 font-semibold ${activeTab === 'incidents' ? 'border-b-2 border-[var(--k-gold-500)] text-[var(--k-gold-500)]' : 'text-muted'}`}
          onClick={() => setActiveTab('incidents')}
        >
          {t('smartlogs.tabs.incidents') || 'Incidents'}
        </button>
        <button 
          className={`pb-2 px-4 font-semibold ${activeTab === 'logs' ? 'border-b-2 border-[var(--k-gold-500)] text-[var(--k-gold-500)]' : 'text-muted'}`}
          onClick={() => setActiveTab('logs')}
        >
          {t('smartlogs.tabs.raw') || 'Raw Logs'}
        </button>
      </div>

      {activeTab === 'incidents' && (
        <div className="flex flex-col gap-4">
          {incidents.length === 0 ? (
            <p className="text-muted">No incidents recorded.</p>
          ) : incidents.map(inc => (
            <Card key={inc.id} className="border-l-4 border-l-[var(--k-danger)]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    {inc.title}
                    <Badge variant={inc.severity === 'high' ? 'danger' : 'warning'}>{inc.severity}</Badge>
                  </h3>
                  <p className="text-xs text-muted mt-1">ID: {inc.id} • {new Date(inc.created_at).toLocaleString()}</p>
                </div>
                {!inc.analysis && (
                  <Button 
                    variant="primary" 
                    className="btn-sm" 
                    loading={analyzingId === inc.id}
                    onClick={() => handleAnalyze(inc.id)}
                  >
                    {t('smartlogs.analyze') || 'Analyze with AI'}
                  </Button>
                )}
              </div>
              
              {inc.analysis && (
                <div className="bg-surface-elevated p-4 rounded-lg mt-4 border border-[var(--border-color)]">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="text-[var(--k-gold-500)]">✨</span> AI Analysis
                  </h4>
                  <div className="grid grid-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted block mb-1">Probable Cause</span>
                      <p>{inc.analysis.probable_cause}</p>
                    </div>
                    <div>
                      <span className="text-muted block mb-1">Impact</span>
                      <p>{inc.analysis.impact}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted block mb-1">Suggestion</span>
                      <p className="font-semibold text-[var(--k-success)]">{inc.analysis.suggestion}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="secondary" className="btn-sm" onClick={() => createTechCard(inc)}>Create Tech Card</Button>
                    <Button variant="secondary" className="btn-sm text-danger border-danger">Resolve</Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'logs' && (
        <Card>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Level</th>
                  <th>Source</th>
                  <th>Module</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {systemLogs.map(log => (
                  <tr key={log.id}>
                    <td className="text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleTimeString()}</td>
                    <td><Badge variant={getLevelBadge(log.level)}>{log.level}</Badge></td>
                    <td>{log.source}</td>
                    <td>{log.module}</td>
                    <td className="w-full">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SmartLogs;
