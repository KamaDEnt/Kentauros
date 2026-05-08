import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Paperclip,
  Bot
} from 'lucide-react';

const KanbanCard = ({ card, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: card.id,
    data: {
      type: 'Card',
      card,
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="kanban-card dragging"
      />
    );
  }

  const getRiskClass = (score) => {
    if (score >= 70) return 'risk-high';
    if (score >= 40) return 'risk-medium';
    return 'risk-low';
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical': return 'badge-danger';
      case 'high': return 'badge-warning';
      case 'medium': return 'badge-info';
      default: return 'badge-secondary';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="kanban-card"
      onClick={() => onClick(card)}
    >
      <div className="kanban-card-header">
        <span className="kanban-card-code">{card.code}</span>
        <span className={`badge ${getPriorityBadge(card.priority)}`}>
          {card.priority}
        </span>
      </div>

      <h4 className="kanban-card-title">{card.title}</h4>
      
      {card.description && (
        <p className="kanban-card-description">{card.description}</p>
      )}

      <div className="kanban-card-footer">
        <div className="kanban-card-agent">
          {card.agent_id ? (
            <div className="agent-avatar-mini" title={`Agente: ${card.agent_id}`}>
              <Bot size={12} />
            </div>
          ) : (
            <div className="agent-avatar-mini" style={{ opacity: 0.3 }}>
              -
            </div>
          )}
        </div>

        <div className="kanban-card-meta">
          {card.checklist_count > 0 && (
            <div className="meta-item">
              <CheckCircle2 size={12} />
              <span>{card.checklist_done}/{card.checklist_count}</span>
            </div>
          )}
          <div className="meta-item">
            <Clock size={12} />
            <span>{new Date(card.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {card.risk_score > 0 && (
        <div className="kanban-card-risk" title={`Risk Score: ${card.risk_score}`}>
          <div 
            className={`kanban-card-risk-inner ${getRiskClass(card.risk_score)}`}
            style={{ width: `${card.risk_score}%` }}
          />
        </div>
      )}
      
      {card.is_blocked && (
        <div className="mt-2 text-danger flex items-center gap-1 text-xs font-bold">
          <AlertTriangle size={12} />
          <span>BLOQUEADO</span>
        </div>
      )}
    </div>
  );
};

export default KanbanCard;
