import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Checkbox from '../ui/Checkbox';
import Switch from '../ui/Switch';
import { 
  Save, 
  Trash2, 
  Plus, 
  CheckSquare, 
  Clock, 
  Tag, 
  User, 
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  X,
  CheckCircle2,
  ChevronRight,
  Bot
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import './KanbanCardModal.css';

const KanbanCardModal = ({ 
  isOpen, 
  onClose, 
  card, 
  onSave, 
  onDelete,
  projects = [],
  clients = []
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    risk_score: 0,
    project_id: '',
    client_id: '',
    tags: [],
    checklist: [],
    is_blocked: false,
    block_reason: '',
    impact_score: 0,
    urgency_score: 0
  });

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  const [discoveryData, setDiscoveryData] = useState({});

  useEffect(() => {
    if (card) {
      setFormData({
        ...card,
        checklist: card.kanban_card_checklists || []
      });
      setDiscoveryData(card.discovery_script || {});
      setActiveTab('details');
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        risk_score: 0,
        project_id: '',
        client_id: '',
        tags: [],
        checklist: []
      });
      setDiscoveryData({});
      setActiveTab('details');
    }
  }, [card, isOpen]);

  useEffect(() => {
    if (isOpen && card) {
      fetchHistory();
    }
  }, [card, isOpen]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('kanban_card_history')
        .select(`
          *,
          from_col:from_column_id(name),
          to_col:to_column_id(name)
        `)
        .eq('card_id', card.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching card history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDiscoveryChange = (agentId, index, field, value) => {
    setDiscoveryData(prev => {
      const newData = { ...prev };
      const agentArtifacts = [...(newData[agentId] || [])];
      agentArtifacts[index] = { ...agentArtifacts[index], [field]: value };
      newData[agentId] = agentArtifacts;
      return newData;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddChecklist = () => {
    if (!newChecklistItem.trim()) return;
    setFormData(prev => ({
      ...prev,
      checklist: [
        ...prev.checklist,
        { id: `new-${Date.now()}`, task: newChecklistItem, is_completed: false }
      ]
    }));
    setNewChecklistItem('');
  };

  const toggleChecklist = (id) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.map(item => 
        (item.id === id) ? { ...item, is_completed: !item.is_completed } : item
      )
    }));
  };

  const removeChecklist = (id) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.filter(item => item.id !== id)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, discovery_script: discoveryData });
  };

  const agentsWithArtifacts = Object.keys(discoveryData || {});

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={card ? `Editar Card: ${card.code}` : 'Novo Card Operacional'}
      className="kanban-modal"
    >
      <div className="kanban-form">
        <div className="form-tabs">
          <button 
            type="button" 
            className={`tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Detalhes
          </button>
          {agentsWithArtifacts.map(agentId => (
            <button 
              key={agentId}
              type="button" 
              className={`tab ${activeTab === agentId ? 'active' : ''}`}
              onClick={() => setActiveTab(agentId)}
            >
              {agentId} Insight
            </button>
          ))}
          {card && (
            <button 
              type="button" 
              className={`tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Histórico
            </button>
          )}
        </div>

        {activeTab === 'details' ? (
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <Input 
                label="Título do Card"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ex: Refinar Backlog de Discovery"
                required
              />

              <Textarea 
                label="Descrição"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Descreva o objetivo desta etapa..."
                wrapperClassName="mt-4"
                rows={4}
              />
            </div>

            <div className="grid grid-2 mt-6">
              <Select 
                label="Prioridade"
                value={formData.priority}
                onChange={(val) => setFormData(prev => ({ ...prev, priority: val }))}
                options={[
                  { label: 'Baixa', value: 'low' },
                  { label: 'Média', value: 'medium' },
                  { label: 'Alta', value: 'high' },
                  { label: 'Crítica', value: 'critical' }
                ]}
              />

              <Input 
                label="Risk Score (0-100)"
                type="number" 
                name="risk_score"
                value={formData.risk_score}
                onChange={handleChange}
                min="0"
                max="100"
              />

              <Input 
                label="Impact Score (0-100)"
                type="number" 
                name="impact_score"
                value={formData.impact_score}
                onChange={handleChange}
                min="0"
                max="100"
              />

              <Input 
                label="Urgency Score (0-100)"
                type="number" 
                name="urgency_score"
                value={formData.urgency_score}
                onChange={handleChange}
                min="0"
                max="100"
              />
            </div>

            <div className="form-section mt-6 p-4 bg-danger-dim/20 rounded-lg border border-danger/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-danger font-bold text-sm">
                  <AlertTriangle size={18} />
                  BLOQUEAR CARD
                </div>
                <Switch 
                  checked={formData.is_blocked}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_blocked: e.target.checked }))}
                />
              </div>
              
              {formData.is_blocked && (
                <Textarea 
                  label="Motivo do Bloqueio"
                  name="block_reason"
                  value={formData.block_reason}
                  onChange={handleChange}
                  placeholder="Descreva o que está impedindo o avanço deste card..."
                  wrapperClassName="mt-3"
                  rows={2}
                />
              )}
            </div>

            <div className="grid grid-2 mt-4">
              <Select 
                label="Projeto Relacionado"
                value={formData.project_id}
                onChange={(val) => setFormData(prev => ({ ...prev, project_id: val }))}
                options={[
                  { label: 'Nenhum', value: '' },
                  ...projects.map(p => ({ label: p.name, value: p.id }))
                ]}
              />

              <Select 
                label="Cliente"
                value={formData.client_id}
                onChange={(val) => setFormData(prev => ({ ...prev, client_id: val }))}
                options={[
                  { label: 'Nenhum', value: '' },
                  ...clients.map(c => ({ label: c.name, value: c.id }))
                ]}
              />
            </div>

            <div className="form-section mt-8">
              <h4 className="section-title flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckSquare size={18} className="text-gold" />
                  Checklist de Entrega
                </span>
                <span className="text-xs text-muted">
                  {formData.checklist.filter(i => i.is_completed).length}/{formData.checklist.length} concluídos
                </span>
              </h4>
              
              <div className="checklist-container mt-4">
                {formData.checklist.map(item => (
                  <div key={item.id} className={`checklist-item ${item.is_completed ? 'completed' : ''}`}>
                    <Checkbox 
                      checked={item.is_completed}
                      onChange={() => toggleChecklist(item.id)}
                    />
                    <span className="checklist-text">{item.task || item.title}</span>
                    <button 
                      type="button" 
                      className="btn-remove"
                      onClick={() => removeChecklist(item.id)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                
                <div className="checklist-add flex gap-2 mt-2">
                  <Input 
                    className="py-2"
                    placeholder="Adicionar item..."
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddChecklist())}
                    wrapperClassName="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="secondary"
                    className="py-2"
                    onClick={handleAddChecklist}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </div>
            </div>

            {card && card.ai_last_output && (
              <div className="form-section mt-8 ai-insight-section">
                <h4 className="section-title flex items-center justify-between text-gold">
                  <span className="flex items-center gap-2">
                    <Bot size={18} />
                    IA Agent Insight ({card.ai_last_agent})
                  </span>
                  {card.is_ai_running && <RefreshCw size={14} className="animate-spin" />}
                </h4>
                <div className="ai-output-box mt-2">
                  <div className="markdown-content">
                    {card.ai_last_output.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="modal-footer-actions flex justify-between mt-8 pt-6 border-t border-subtle">
              {card ? (
                <Button 
                  variant="danger" 
                  className="flex items-center gap-2"
                  onClick={() => onDelete(card.id)}
                >
                  <Trash2 size={16} />
                  Excluir Card
                </Button>
              ) : <div></div>}
              
              <div className="flex gap-3">
                <Button variant="secondary" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex items-center gap-2">
                  <Save size={16} />
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </form>
        ) : activeTab === 'history' ? (
          <div className="history-tab-content">
            <h4 className="section-title flex items-center gap-2 text-gold mb-4">
              <Clock size={18} />
              Histórico de Movimentação
            </h4>
            
            {loadingHistory ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="animate-spin text-gold" size={24} />
              </div>
            ) : history.length > 0 ? (
              <div className="history-timeline">
                {history.map((item) => (
                  <div key={item.id} className="history-entry">
                    <div className="history-icon">
                      <ChevronRight size={14} />
                    </div>
                    <div className="history-content">
                      <div className="history-header">
                        <span className="history-action">{item.action === 'move' ? 'Movido' : item.action}</span>
                        <span className="history-date">{new Date(item.created_at).toLocaleString()}</span>
                      </div>
                      {item.action === 'move' && (
                        <p className="history-details">
                          De <strong>{item.from_col?.name || 'Início'}</strong> para <strong>{item.to_col?.name}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted text-sm">Nenhum histórico registrado.</p>
            )}
          </div>
        ) : (
          <div className="agent-tab-content">
            <h4 className="section-title flex items-center gap-2 text-gold mb-4">
              <Bot size={18} />
              Artefatos do Agente: {activeTab}
            </h4>
            
            {activeTab === 'BA' && (
              <div className="discovery-questions">
                {discoveryData.BA?.map((q, idx) => (
                  <div key={idx} className="question-card">
                    <div className="question-header">
                      <span className="question-number">#{idx + 1}</span>
                      <p className="question-text">{q.question}</p>
                    </div>
                    <Textarea 
                      placeholder="Sua resposta aqui..."
                      value={q.answer}
                      onChange={(e) => handleDiscoveryChange('BA', idx, 'answer', e.target.value)}
                      rows={2}
                      wrapperClassName="mt-2"
                    />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'UX' && (
              <div className="ux-artifact-grid">
                <table className="artifact-table">
                  <thead>
                    <tr>
                      <th>Item Interface</th>
                      <th>Status</th>
                      <th>Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discoveryData.UX?.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.item}</td>
                        <td>
                          <Select 
                            value={item.status} 
                            onChange={(val) => handleDiscoveryChange('UX', idx, 'status', val)}
                            options={[
                              { label: 'Pendente', value: 'pending' },
                              { label: 'Prototipando', value: 'prototyping' },
                              { label: 'Pronto', value: 'done' }
                            ]}
                            className="status-select"
                          />
                        </td>
                        <td>
                          <Input 
                            value={item.note} 
                            onChange={(e) => handleDiscoveryChange('UX', idx, 'note', e.target.value)}
                            className="inline-edit"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'DEV' && (
              <div className="dev-artifact-list">
                {discoveryData.DEV?.map((comp, idx) => (
                  <div key={idx} className="tech-card">
                    <div className="tech-header">
                      <strong>{comp.component}</strong>
                      <span className="tech-badge">{comp.tech}</span>
                    </div>
                    <Input 
                      value={comp.notes} 
                      onChange={(e) => handleDiscoveryChange('DEV', idx, 'notes', e.target.value)}
                      wrapperClassName="mt-2"
                    />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'QA' && (
              <div className="qa-scenarios">
                {discoveryData.QA?.map((sc, idx) => (
                  <div key={idx} className="scenario-card">
                    <div className="scenario-header">
                      <strong>Cenário: {sc.scenario}</strong>
                    </div>
                    <div className="scenario-body">
                      <p className="text-xs"><strong>Passos:</strong> {sc.steps}</p>
                      <p className="text-xs"><strong>Esperado:</strong> {sc.expected}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-footer-actions mt-8 pt-6 border-t border-subtle flex justify-end">
              <Button onClick={handleSubmit}>
                Salvar Artefatos
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'details' && (!card?.discovery_script || Object.keys(card.discovery_script).length === 0) && (
          <div className="empty-discovery-alert mt-8 p-4 bg-muted/50 rounded-lg flex items-center gap-4 text-sm text-muted">
            <AlertCircle size={20} className="text-gold" />
            <div>
              <p className="font-semibold text-white">Nenhum Insight de Agente ainda</p>
              <p>Mova este card para colunas como "Discovery", "UX Design" ou "Desenvolvimento" para que os agentes de IA gerem artefatos automaticamente.</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default KanbanCardModal;
