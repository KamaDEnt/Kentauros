import React, { createContext, useContext, useState, useEffect } from 'react';
import { useApp } from './AppContext';

const LogsContext = createContext();
const SYSTEM_LOGS_KEY = 'kentauros_system_logs';
const INCIDENTS_KEY = 'kentauros_incidents';

export const LogsProvider = ({ children }) => {
  const { user, addNotification } = useApp();
  const [systemLogs, setSystemLogs] = useState([]);
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    const savedLogs = JSON.parse(localStorage.getItem(SYSTEM_LOGS_KEY) || '[]');
    const savedIncidents = JSON.parse(localStorage.getItem(INCIDENTS_KEY) || '[]');
    if (savedLogs.length) {
      setSystemLogs(savedLogs);
      setIncidents(savedIncidents);
      return;
    }

    setSystemLogs([
      {
        id: '1',
        tenant_id: 'tenant-a',
        level: 'error',
        source: 'Backend API',
        module: 'Projects',
        message: 'Timeout fetching project details',
        stack_trace: 'Error: Timeout at Object.fetch (http.js:102)',
        metadata: { endpoint: '/api/projects/12' },
        user_id: 1,
        project_id: 12,
        client_id: null,
        created_at: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: '2',
        tenant_id: 'tenant-a',
        level: 'warning',
        source: 'Frontend',
        module: 'UI',
        message: 'Slow render detected on Kanban board',
        stack_trace: null,
        metadata: { renderTimeMs: 450 },
        user_id: 1,
        project_id: null,
        client_id: null,
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ]);
  }, []);

  useEffect(() => {
    localStorage.setItem(SYSTEM_LOGS_KEY, JSON.stringify(systemLogs));
  }, [systemLogs]);

  useEffect(() => {
    localStorage.setItem(INCIDENTS_KEY, JSON.stringify(incidents));
  }, [incidents]);

  const logSystemEvent = (level, source, module, message, stackTrace = null, metadata = {}, projectId = null, clientId = null) => {
    const newLog = {
      id: Date.now().toString(),
      tenant_id: user?.tenant_id || 'system',
      level,
      source,
      module,
      message,
      stack_trace: stackTrace,
      metadata,
      user_id: user?.id,
      project_id: projectId,
      client_id: clientId,
      created_at: new Date().toISOString()
    };

    setSystemLogs(prev => [newLog, ...prev]);

    // Simple automation: if critical/error, generate incident
    if (level === 'error' || level === 'critical') {
      const newIncident = {
        id: `INC-${Math.floor(Math.random() * 10000)}`,
        log_id: newLog.id,
        status: 'open',
        title: `Automatic Incident: ${message}`,
        severity: level === 'critical' ? 'high' : 'medium',
        created_at: newLog.created_at,
        analysis: null // To be filled by AI later
      };
      setIncidents(prev => [newIncident, ...prev]);
      
      if (addNotification) {
        addNotification(`Incidente ${level === 'critical' ? 'Crítico' : 'Detectado'}`, message, 'error');
      }
    }
  };

  const analyzeIncidentWithAI = (incidentId) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          analysis: {
            summary: "AI detected a potential rate limit issue on the backend.",
            probable_cause: "High traffic volume during batch processing.",
            impact: "Users may experience temporary slowness.",
            suggestion: "Scale up API instances or implement exponential backoff.",
            priority: "high",
            responsible: "DevOps Team"
          }
        };
      }
      return inc;
    }));
  };

  return (
    <LogsContext.Provider value={{ systemLogs, incidents, logSystemEvent, analyzeIncidentWithAI }}>
      {children}
    </LogsContext.Provider>
  );
};

export const useLogs = () => useContext(LogsContext);
