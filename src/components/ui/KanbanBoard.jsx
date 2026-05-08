import React from 'react';
import Badge from './Badge';

const KanbanBoard = ({ columns = [], data = [], onCardClick }) => {
  if (!Array.isArray(columns) || !Array.isArray(data)) {
    return (
      <div className="kanban-empty">
        <p className="text-muted">No board data available.</p>
      </div>
    );
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <div className="kanban-board">
      {columns.map(col => {
        const columnItems = data.filter(item => item.status === col.id);
        return (
          <div key={col.id} className="kanban-column">
            <div className="kanban-column-header">
              <h4 className="kanban-column-title">
                {col.title}
                <span className="kanban-column-count">{columnItems.length}</span>
              </h4>
            </div>

            <div className="kanban-column-body">
              {columnItems.map(item => (
                <div
                  key={item.id}
                  className="kanban-card"
                  onClick={() => onCardClick && onCardClick(item)}
                  role={onCardClick ? 'button' : undefined}
                  tabIndex={onCardClick ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (onCardClick && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onCardClick(item);
                    }
                  }}
                >
                  <div className="kanban-card-top">
                    <Badge variant={getPriorityColor(item.priority)}>
                      {item.priority || 'normal'}
                    </Badge>
                    <span className="text-xs text-muted font-mono">
                      #{String(item.id).substring(0, 6)}
                    </span>
                  </div>
                  <div className="kanban-card-title">{item.title}</div>
                  {item.description && (
                    <div className="kanban-card-desc">{item.description}</div>
                  )}
                  <div className="kanban-card-footer">
                    <span className="kanban-card-project">{item.project}</span>
                    <div className="kanban-card-avatar" title={String(item.assignee || item.assigneeEmail || 'Unassigned')}>
                      {String(item.assigneeEmail || item.assignee || 'U').charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
              {columnItems.length === 0 && (
                <div className="kanban-empty-col">
                  <span className="text-xs text-muted">No items</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
