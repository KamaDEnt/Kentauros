import React, { createContext, useContext, useState, useEffect } from 'react';
import { useApp } from './AppContext';

const AuditContext = createContext();
const AUDIT_KEY = 'kentauros_audit_logs';

export const AuditProvider = ({ children }) => {
  const { user } = useApp();
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    const savedLogs = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
    if (savedLogs.length) {
      setAuditLogs(savedLogs);
      return;
    }

    setAuditLogs([
      {
        id: '1',
        tenant_id: 'tenant-a',
        user_id: 1,
        user_name: 'Admin Master',
        user_role: 'admin',
        action: 'LOGIN',
        module: 'Auth',
        entity_name: 'System',
        entity_id: null,
        project_id: null,
        client_id: null,
        previous_value: null,
        new_value: 'Successful login',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0',
        severity: 'baixa',
        status: 'success',
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ]);
  }, []);

  useEffect(() => {
    localStorage.setItem(AUDIT_KEY, JSON.stringify(auditLogs));
  }, [auditLogs]);

  const logAudit = (action, module, entityName, entityId, previousValue, newValue, severity = 'baixa', projectId = null, clientId = null) => {
    if (!user) return;
    
    const newLog = {
      id: Date.now().toString(),
      tenant_id: user.tenant_id,
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action,
      module,
      entity_name: entityName,
      entity_id: entityId,
      project_id: projectId,
      client_id: clientId,
      previous_value: previousValue ? JSON.stringify(previousValue) : null,
      new_value: newValue ? JSON.stringify(newValue) : null,
      ip_address: '127.0.0.1', // mocked
      user_agent: navigator.userAgent,
      severity,
      status: 'success',
      created_at: new Date().toISOString()
    };

    setAuditLogs(prev => [newLog, ...prev]);
  };

  return (
    <AuditContext.Provider value={{ auditLogs, logAudit }}>
      {children}
    </AuditContext.Provider>
  );
};

export const useAudit = () => useContext(AuditContext);
