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
import Textarea from '../components/ui/Textarea';
import { useI18n } from '../context/I18nContext';
import { LifeBuoy, MessageSquare, Plus, AlertCircle, Clock, CheckCircle, User } from 'lucide-react';

const Support = () => {
  const { tickets, updateTicket, addTicket, projects, addLearningEvent } = useData();
  const { addNotification } = useApp();
  const { t } = useI18n();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [reply, setReply] = useState('');
  
  // State for new ticket form
  const [newTicket, setNewTicket] = useState({
    title: '',
    projectId: projects[0]?.id || 1,
    priority: 'medium',
    category: 'bug',
    description: ''
  });

  const getPriorityType = (priority) => {
    switch (priority) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'accent';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusType = (status) => {
    switch (status) {
      case 'open': return 'danger';
      case 'in_progress': return 'warning';
      case 'resolved': return 'success';
      default: return 'secondary';
    }
  };

  const handleSendReply = () => {
    if (!reply.trim()) {
      addNotification(t('common.error'), t('support.notification.replyRequired'), 'error');
      return;
    }

    updateTicket(selectedTicket.id, { 
      status: 'resolved', 
      updatedAt: new Date().toISOString() 
    });
    addLearningEvent({
      source: 'support',
      event_type: 'ticket_resolved',
      title: selectedTicket.title,
      content: reply,
      project_id: String(selectedTicket.projectId || ''),
      tags: ['Support', 'Resolution'],
      metadata: { ticketId: selectedTicket.id },
    });

    addNotification(t('common.success'), `${t('support.notification.replySent')} #${selectedTicket.id}. ${t('support.notification.markedResolved')}`, 'success');
    setSelectedTicket(null);
    setReply('');
  };

  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!newTicket.title || !newTicket.description) {
      addNotification(t('common.error'), t('support.notification.fillRequired'), 'error');
      return;
    }

    const ticket = addTicket({
      ...newTicket,
      status: 'open',
      sla: '4h',
      slaRemaining: '4h 00m',
      assignee: 11,
      reporter: 12,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    addLearningEvent({
      source: 'support',
      event_type: 'ticket_created',
      title: newTicket.title,
      content: newTicket.description,
      project_id: String(newTicket.projectId || ''),
      tags: ['Support', newTicket.priority],
      metadata: { ticketId: ticket.id },
    });

    addNotification(t('common.success'), t('support.notification.created'), 'success');
    setIsNewTicketModalOpen(false);
    setNewTicket({
      title: '',
      projectId: projects[0]?.id || 1,
      priority: 'medium',
      category: 'bug',
      description: ''
    });
  };

  const quickReplies = [
    t('support.quickReply1'),
    t('support.quickReply2'),
    t('support.quickReply3'),
    t('support.quickReply4')
  ];

  return (
    <div className="support-page animate-fade-in">
      <PageHeader 
        title={t('support.title')} 
        subtitle={t('support.subtitle')}
        actions={
          <Button 
            variant="primary" 
            onClick={() => setIsNewTicketModalOpen(true)}
            icon={<Plus size={18} />}
          >
            {t('support.newTicket')}
          </Button>
        }
      />

      <div className="grid grid-4 mb-xl">
        <StatCard label={t('support.activeTickets')} value={tickets.filter(t => t.status !== 'resolved').length} change={`2 ${t('support.urgent')}`} trend="down" />
        <StatCard label={t('support.avgResponse')} value="14m" change={`-2m ${t('support.vsYesterday')}`} trend="up" />
        <StatCard label={t('support.slaCompliance')} value="98.5%" change={t('support.aboveTarget')} trend="up" />
        <StatCard label={t('support.resolvedToday')} value={tickets.filter(t => t.status === 'resolved').length} change={`+4 ${t('support.vsYesterday')}`} trend="up" />
      </div>

      <Card title={t('support.activeTickets')}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{t('support.ticket')}</th>
                <th>{t('support.priority')}</th>
                <th>{t('common.status')}</th>
                <th>{t('support.slaRemaining')}</th>
                <th>{t('support.assignee')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => (
                <tr key={ticket.id}>
                  <td>
                    <div className="font-bold">{ticket.title}</div>
                    <div className="text-xs text-muted">ID: {ticket.id} • Project: {projects.find(p => p.id === ticket.projectId)?.name || ticket.projectId}</div>
                  </td>
                  <td>
                    <Badge variant={getPriorityType(ticket.priority)}>
                      {ticket.priority.toUpperCase()}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={getStatusType(ticket.status)}>
                      {t(`status.${ticket.status}`)}
                    </Badge>
                  </td>
                  <td>
                    <div className={`font-mono ${ticket.slaRemaining && ticket.slaRemaining.includes('0h') ? 'text-danger' : ''}`}>
                      {ticket.slaRemaining || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">{t('support.agent')} {ticket.assignee}</div>
                  </td>
                  <td>
                    <Button 
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      {t('support.manage')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Ticket Modal */}
      <Modal
        isOpen={isNewTicketModalOpen}
        onClose={() => setIsNewTicketModalOpen(false)}
        title={t('support.openNew')}
        actions={
          <>
            <Button variant="secondary" onClick={() => setIsNewTicketModalOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" onClick={handleCreateTicket}>{t('support.newTicket')}</Button>
          </>
        }
      >
        <form className="flex flex-col gap-md">
          <Input 
            label={t('support.titleLabel')}
            value={newTicket.title}
            onChange={e => setNewTicket({...newTicket, title: e.target.value})}
            placeholder={t('support.titlePlaceholder')}
            icon={<MessageSquare size={18} />}
          />
          <div className="grid grid-2">
            <Select 
              label={t('common.project')}
              value={newTicket.projectId}
              onChange={val => setNewTicket({...newTicket, projectId: val})}
              options={projects.map(p => ({ value: p.id, label: p.name }))}
            />
            <Select 
              label={t('support.priority')}
              value={newTicket.priority}
              onChange={val => setNewTicket({...newTicket, priority: val})}
              options={[
                { value: 'low', label: t('common.low') },
                { value: 'medium', label: t('common.medium') },
                { value: 'high', label: t('common.high') },
                { value: 'critical', label: t('common.critical') }
              ]}
            />
          </div>
          <Textarea 
            label={t('support.descLabel')}
            rows="4"
            value={newTicket.description}
            onChange={e => setNewTicket({...newTicket, description: e.target.value})}
            placeholder={t('support.descPlaceholder')}
          />
        </form>
      </Modal>

      {/* Manage Ticket Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => {
          setSelectedTicket(null);
          setReply('');
        }}
        title={`${t('support.manageTicket')} #${selectedTicket?.id}: ${selectedTicket?.title}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => {
              setSelectedTicket(null);
              setReply('');
            }}>{t('common.close')}</Button>
            <Button variant="primary" onClick={handleSendReply}>{t('support.sendAndResolve')}</Button>
          </>
        }
      >
        {selectedTicket && (
          <div className="ticket-details">
            <div className="grid grid-2 mb-lg">
              <div className="flex flex-col gap-xs">
                <span className="text-xs text-muted uppercase tracking-wider">{t('common.status')}</span>
                <Badge variant={getStatusType(selectedTicket.status)}>{t(`status.${selectedTicket.status}`)}</Badge>
              </div>
              <div className="flex flex-col gap-xs">
                <span className="text-xs text-muted uppercase tracking-wider">{t('support.priority')}</span>
                <Badge variant={getPriorityType(selectedTicket.priority)}>{t(`common.${selectedTicket.priority}`)}</Badge>
              </div>
            </div>

            <div className="mb-lg">
              <span className="text-xs text-muted uppercase tracking-wider block mb-sm">{t('support.messageHistory')}</span>
              <div className="flex flex-col gap-sm" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', alignSelf: 'flex-start', maxWidth: '80%' }}>
                  <div className="text-xs font-bold mb-xs">{t('support.customer')}</div>
                  <div className="text-sm">{selectedTicket.description || 'User reported an issue with the dashboard loading slowly during peak hours.'}</div>
                  <div className="text-[10px] text-muted mt-xs">{new Date(selectedTicket.createdAt).toLocaleString()}</div>
                </div>
                {selectedTicket.status === 'resolved' && (
                  <div style={{ background: 'var(--accent)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', alignSelf: 'flex-end', maxWidth: '80%', color: 'white' }}>
                    <div className="text-xs font-bold mb-xs text-white">{t('support.agent')}</div>
                    <div className="text-sm">The issue has been investigated and resolved. Optimization steps were applied to the dashboard components.</div>
                    <div className="text-[10px] opacity-70 mt-xs">{new Date(selectedTicket.updatedAt).toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>

            {selectedTicket.status !== 'resolved' && (
              <div className="mb-lg">
                <span className="text-xs text-muted uppercase tracking-wider block mb-sm">{t('support.quickReplies')}</span>
                <div className="flex gap-xs flex-wrap mb-sm">
                  {quickReplies.map((qr, i) => (
                    <Button 
                      key={i} 
                      variant="secondary"
                      size="sm"
                      onClick={() => setReply(qr)}
                    >
                      {qr.substring(0, 25)}...
                    </Button>
                  ))}
                </div>
                <Textarea 
                  label={t('support.yourReply')}
                  rows="3" 
                  placeholder={t('support.typeReply')}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
              </div>
            )}

            <div className="flex justify-between items-center text-xs text-muted">
              <span>{t('support.slaRemaining')}: {selectedTicket.slaRemaining}</span>
              <span>{t('support.assignee')}: {t('support.agent')} {selectedTicket.assignee}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Support;
