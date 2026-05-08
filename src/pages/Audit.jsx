import React, { useState } from 'react';
import { useAudit } from '../context/AuditContext';
import { useI18n } from '../context/I18nContext';
import { useApp } from '../context/AppContext';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const Audit = () => {
  const { t } = useI18n();
  const { auditLogs } = useAudit();
  const { addNotification } = useApp();
  const [filter, setFilter] = useState('');

  const filteredLogs = auditLogs.filter(log => 
    log.action.toLowerCase().includes(filter.toLowerCase()) || 
    log.module.toLowerCase().includes(filter.toLowerCase()) ||
    log.user_name.toLowerCase().includes(filter.toLowerCase())
  );

  const exportCSV = () => {
    const csvHeader = 'ID,Data/Hora,Usuario,Role,Modulo,Acao,Severidade,IP\n';
    const csvBody = filteredLogs.map(log => 
      `${log.id},"${new Date(log.created_at).toLocaleString()}","${log.user_name}","${log.user_role}","${log.module}","${log.action}","${log.severity}","${log.ip_address}"`
    ).join('\n');
    
    const blob = new Blob([csvHeader + csvBody], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `auditoria_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addNotification('Exportação Concluída', 'O arquivo CSV de auditoria foi baixado.', 'success');
  };

  return (
    <div className="audit-page animate-fade-in">
      <PageHeader 
        title={t('nav.audit') || 'Auditoria'}
        subtitle="Registro imutável de ações do sistema"
        actions={
          <Button variant="primary" onClick={exportCSV}>
            Exportar CSV
          </Button>
        }
      />

      <Card>
        <div className="mb-4">
          <input 
            type="text" 
            placeholder="Filtrar por ação, módulo ou usuário..." 
            className="input w-full max-w-md"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Usuário</th>
                <th>Módulo</th>
                <th>Ação</th>
                <th>Severidade</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id}>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                  <td>
                    <div>{log.user_name}</div>
                    <div className="text-xs text-muted">{log.user_role}</div>
                  </td>
                  <td>{log.module}</td>
                  <td>
                    <Badge variant={log.severity === 'alta' ? 'danger' : log.severity === 'media' ? 'warning' : 'info'}>
                      {log.action}
                    </Badge>
                  </td>
                  <td>{log.severity}</td>
                  <td className="text-xs text-muted">{log.ip_address}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-8">Nenhum log de auditoria encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Audit;
