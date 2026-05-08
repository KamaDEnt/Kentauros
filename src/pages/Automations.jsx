import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useApp } from '../context/AppContext';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import StatCard from '../components/ui/StatCard';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Switch from '../components/ui/Switch';
import { useI18n } from '../context/I18nContext';
import { Zap, Play, Settings, History, Plus, AlertCircle, Terminal } from 'lucide-react';
import { AUTOMATION_TEMPLATES, createAutomationLog, runAutomationAction } from '../services/ecosystemAutomation';

const Automations = () => {
  const {
    automations,
    leads,
    backlog,
    qaTests,
    updateLead,
    updateAutomation,
    addAutomation,
    addQaTest,
    addDeployment,
    addLearningEvent,
  } = useData();
  const { addNotification } = useApp();
  const { t } = useI18n();
  
  const [selectedAuto, setSelectedAuto] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(null);
  const totalRuns = automations.reduce((sum, item) => sum + Number(item.runs || 0), 0);
  const totalSuccess = automations.reduce((sum, item) => sum + Number(item.success || 0), 0);
  const successRate = totalRuns ? Math.round((totalSuccess / totalRuns) * 1000) / 10 : 0;

  const [newAutomation, setNewAutomation] = useState({
    name: '',
    trigger: t('automations.trigger.newLead'),
    action: t('automations.action.slack'),
    status: 'active'
  });

  const handleCreateAutomation = (e) => {
    e.preventDefault();
    if (!newAutomation.name) {
      addNotification(t('common.error'), t('automations.notification.errorName'), 'error');
      return;
    }
    addAutomation({
      ...newAutomation,
      runs: 0,
      success: 0,
      lastRun: 'Never'
    });
    addNotification(t('common.success'), t('automations.notification.created'), 'success');
    setIsCreateModalOpen(false);
    setNewAutomation({ name: '', trigger: t('automations.trigger.newLead'), action: t('automations.action.slack'), status: 'active' });
  };

  const installTemplates = () => {
    const existingNames = new Set(automations.map(item => item.name));
    let created = 0;
    AUTOMATION_TEMPLATES.forEach(template => {
      if (existingNames.has(template.name)) return;
      addAutomation({
        ...template,
        status: 'active',
        runs: 0,
        success: 0,
        lastRun: 'Never',
        logs: [],
      });
      created += 1;
    });
    addNotification('Automações instaladas', `${created} automações do ecossistema foram preparadas.`, 'success');
  };

  const handleRunNow = (auto) => {
    setIsRunning(auto.id);
    addNotification(t('automations.notification.running'), `${t('common.running')} ${auto.name}...`, 'info');
    
    setTimeout(() => {
      const result = runAutomationAction({
        automation: auto,
        data: { leads, backlog, qaTests },
        actions: { updateLead, addQaTest, addDeployment },
      });
      const success = result.status === 'success' ? 1 : 0;
      const log = createAutomationLog(result.status, result.message, { entityId: result.entityId, action: auto.action });
      updateAutomation(auto.id, { 
        runs: Number(auto.runs || 0) + 1,
        success: Number(auto.success || 0) + success,
        lastRun: new Date().toLocaleTimeString(),
        logs: [log, ...(auto.logs || [])].slice(0, 20),
      });
      addLearningEvent({
        source: 'automation',
        event_type: 'automation_run',
        title: auto.name,
        content: result.message,
        tags: ['Automation', auto.module || 'general', result.status],
        metadata: { automationId: auto.id, action: auto.action, result },
      });
      addNotification(result.status === 'success' ? t('common.success') : 'Automação sem ação', result.message, result.status === 'success' ? 'success' : 'warning');
      setIsRunning(null);
    }, 1500);
  };

  return (
    <div className="automations-page animate-fade-in">
      <PageHeader 
        title={t('automations.title')} 
        subtitle={t('automations.subtitle')}
        actions={
          <div className="flex gap-sm">
            <Button variant="secondary" onClick={installTemplates}>Instalar fluxo Kentauros</Button>
            <Button 
              variant="primary" 
              onClick={() => setIsCreateModalOpen(true)}
              icon={<Plus size={18} />}
            >
              {t('automations.create')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-3 mb-xl">
        <StatCard label={t('automations.active')} value={automations.filter(a => a.status === 'active').length} />
        <StatCard label={t('automations.totalRuns')} value={totalRuns} trend="up" />
        <StatCard label={t('automations.successRate')} value={`${successRate}%`} trend="up" />
      </div>

      <div className="grid grid-2">
        {automations.map(auto => (
          <Card 
            key={auto.id} 
            title={auto.name}
            headerActions={<Badge variant={auto.status === 'active' ? 'success' : 'secondary'}>{auto.status.toUpperCase()}</Badge>}
            footer={
              <div className="flex gap-xs w-full">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="flex-1" 
                  onClick={() => { setSelectedAuto(auto); setIsLogsModalOpen(true); }}
                  icon={<History size={14} />}
                >
                  {t('automations.logs')}
                </Button>
                <Button 
                  variant="accent" 
                  size="sm" 
                  className="flex-1" 
                  onClick={() => setSelectedAuto(auto)}
                  icon={<Settings size={14} />}
                >
                  {t('automations.configure')}
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="flex-1" 
                  disabled={isRunning === auto.id}
                  onClick={() => handleRunNow(auto)}
                  icon={<Play size={14} />}
                >
                  {isRunning === auto.id ? t('common.running') : t('automations.runNow')}
                </Button>
              </div>
            }
          >
            <div className="flex flex-col gap-sm">
              <div className="flex flex-col gap-xs">
                <span className="text-xs text-muted uppercase tracking-wider">{t('automations.trigger')}</span>
                <div className="text-sm font-mono p-sm bg-secondary border-subtle border-radius-sm">
                  {auto.trigger}
                </div>
              </div>
              <div className="flex flex-col gap-xs">
                <span className="text-xs text-muted uppercase tracking-wider">{t('automations.action')}</span>
                <div className="text-sm font-mono p-sm bg-secondary border-subtle border-radius-sm">
                  {auto.action}()
                </div>
              </div>
            </div>

            <div className="grid grid-3 bg-secondary p-md border-radius-sm mt-md">
              <div className="flex flex-col gap-xs text-center border-right border-subtle">
                <span className="text-xs text-muted uppercase tracking-wider">{t('automations.runs')}</span>
                <span className="text-sm font-bold">{auto.runs}</span>
              </div>
              <div className="flex flex-col gap-xs text-center border-right border-subtle">
                <span className="text-xs text-muted uppercase tracking-wider">{t('automations.success')}</span>
                <span className="text-sm text-success font-bold">{auto.success}</span>
              </div>
              <div className="flex flex-col gap-xs text-center">
                <span className="text-xs text-muted uppercase tracking-wider">{t('automations.lastRun')}</span>
                <span className="text-sm">{auto.lastRun || t('common.noData')}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Workflow Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={t('automations.newWorkflow')}
        actions={
          <>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" onClick={handleCreateAutomation}>{t('automations.create')}</Button>
          </>
        }
      >
        <form className="flex flex-col gap-md">
          <Input 
            label={t('automations.workflowName')}
            value={newAutomation.name}
            onChange={e => setNewAutomation({...newAutomation, name: e.target.value})}
            placeholder={t('automations.workflowPlaceholder')}
            icon={<Zap size={18} />}
          />
          <div className="grid grid-2">
            <Select 
              label={t('automations.trigger')}
              value={newAutomation.trigger}
              onChange={val => setNewAutomation({...newAutomation, trigger: val})}
              options={[
                { value: t('automations.trigger.newLead'), label: t('automations.trigger.newLead') },
                { value: t('automations.trigger.ticketCritical'), label: t('automations.trigger.ticketCritical') },
                { value: t('automations.trigger.deployFail'), label: t('automations.trigger.deployFail') },
                { value: t('automations.trigger.scheduled'), label: t('automations.trigger.scheduled') }
              ]}
            />
            <Select 
              label={t('automations.action')}
              value={newAutomation.action}
              onChange={val => setNewAutomation({...newAutomation, action: val})}
              options={[
                { value: t('automations.action.slack'), label: t('automations.action.slack') },
                { value: t('automations.action.ticket'), label: t('automations.action.ticket') },
                { value: t('automations.action.email'), label: t('automations.action.email') },
                { value: t('automations.action.ci'), label: t('automations.action.ci') }
              ]}
            />
          </div>
        </form>
      </Modal>

      {/* Configure Modal */}
      <Modal
        isOpen={!!selectedAuto && !isLogsModalOpen}
        onClose={() => setSelectedAuto(null)}
        title={`${t('automations.configure')}: ${selectedAuto?.name}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setSelectedAuto(null)}>{t('common.cancel')}</Button>
            <Button variant="primary" onClick={() => {
              addNotification(t('common.success'), t('automations.notification.saved'), 'success');
              setSelectedAuto(null);
            }}>{t('common.save')}</Button>
          </>
        }
      >
        {selectedAuto && (
          <div className="flex flex-col gap-md">
            <div className="flex items-center justify-between p-md bg-secondary border-radius-sm">
              <div>
                <div className="text-sm font-bold">{t('automations.status')}</div>
                <div className="text-xs text-muted">{t('automations.statusDesc')}</div>
              </div>
              <Switch 
                checked={selectedAuto.status === 'active'}
                onChange={val => updateAutomation(selectedAuto.id, { status: val ? 'active' : 'paused' })}
                label={selectedAuto.status.toUpperCase()}
              />
            </div>
            <div className="bg-secondary p-md border-radius-sm">
              <div className="text-xs font-bold mb-sm">{t('automations.params')}</div>
              <pre className="text-xs mono" style={{ margin: 0, opacity: 0.7 }}>
                {`{
  "retry_policy": "exponential",
  "max_retries": 3,
  "timeout": "30s",
  "webhook_url": "https://hooks.slack.com/services/..."
}`}
              </pre>
            </div>
          </div>
        )}
      </Modal>

      {/* Logs Modal */}
      <Modal
        isOpen={isLogsModalOpen}
        onClose={() => { setIsLogsModalOpen(false); setSelectedAuto(null); }}
        title={`${t('automations.executionLogs')}: ${selectedAuto?.name}`}
        actions={<Button variant="secondary" onClick={() => { setIsLogsModalOpen(false); setSelectedAuto(null); }}>{t('common.close')}</Button>}
      >
        <div className="flex flex-col gap-sm">
          {((selectedAuto?.logs || []).length ? selectedAuto.logs : [createAutomationLog('info', 'Nenhum log real registrado ainda.')]).map(log => (
            <div key={log.id} className="text-xs p-sm border-subtle" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
              <div className="flex justify-between mb-xs">
                <span className={`font-bold ${log.status === 'success' ? 'text-success' : log.status === 'skipped' ? 'text-warning' : 'text-muted'}`}>{String(log.status).toUpperCase()}</span>
                <span className="text-muted">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
              <div className="mono opacity-70">{log.message}</div>
            </div>
          ))}
          <div className="text-center pt-md">
            <Button variant="secondary" size="sm">{t('automations.loadMore')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Automations;
