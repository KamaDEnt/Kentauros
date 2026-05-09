import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';
import { MoreHorizontal, Plus } from 'lucide-react';

const KanbanColumn = ({ column, cards, onCardClick, onAddCard }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  return (
    <div 
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'over' : ''}`}
    >
      <div className="kanban-column-header">
        <div className="kanban-column-title">
          <span>{column.name}</span>
          <span className="kanban-column-count">{cards.length}</span>
        </div>
        <div className="kanban-column-actions">
          <button 
            className="btn-ghost btn-icon btn-sm" 
            onClick={() => onAddCard(column.id)}
            aria-label={`Adicionar card em ${column.name}`}
          >
            <Plus size={16} />
          </button>
          <button className="btn-ghost btn-icon btn-sm" aria-label={`Mais opções de ${column.name}`}>
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      <div className="kanban-card-list">
        <SortableContext 
          items={cards.map(c => c.id)} 
          strategy={verticalListSortingStrategy}
        >
          {cards.map(card => (
            <KanbanCard 
              key={card.id} 
              card={card} 
              onClick={onCardClick}
            />
          ))}
        </SortableContext>
        
        {cards.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-muted opacity-20 py-10">
            <div className="border-2 border-dashed border-current rounded-lg p-6 flex flex-col items-center gap-2">
              <Plus size={24} />
              <span className="text-xs font-bold uppercase tracking-widest">Solte aqui</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
