import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import './KanbanBoard.css';

const KanbanBoard = ({ columns, cards, onMoveCard, onCardClick, onAddCard }) => {
  const [activeCard, setActiveCard] = useState(null);
  const [orderedCards, setOrderedCards] = useState(cards);

  useEffect(() => {
    setOrderedCards(cards);
  }, [cards]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const onDragStart = (event) => {
    if (event.active.data.current?.type === 'Card') {
      setActiveCard(event.active.data.current.card);
    }
  };

  const onDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveACard = active.data.current?.type === 'Card';
    const isOverACard = over.data.current?.type === 'Card';
    const isOverAColumn = over.data.current?.type === 'Column';

    if (!isActiveACard) return;

    // Dropping a card over another card
    if (isActiveACard && isOverACard) {
      setOrderedCards((cards) => {
        const activeIndex = cards.findIndex((c) => c.id === activeId);
        const overIndex = cards.findIndex((c) => c.id === overId);

        if (cards[activeIndex].column_id !== cards[overIndex].column_id) {
          const newCards = [...cards];
          newCards[activeIndex] = { ...newCards[activeIndex], column_id: cards[overIndex].column_id };
          return arrayMove(newCards, activeIndex, overIndex);
        }

        return arrayMove(cards, activeIndex, overIndex);
      });
    }

    // Dropping a card over a column
    if (isActiveACard && isOverAColumn) {
      setOrderedCards((cards) => {
        const activeIndex = cards.findIndex((c) => c.id === activeId);
        const newCards = [...cards];
        newCards[activeIndex] = { ...newCards[activeIndex], column_id: overId };
        return arrayMove(newCards, activeIndex, activeIndex);
      });
    }
  };

  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over) {
      setActiveCard(null);
      return;
    }

    const activeId = active.id;
    const activeCardData = active.data.current?.card;
    const currentCardData = orderedCards.find((card) => card.id === activeId);
    const overColumnId = over.data.current?.type === 'Column'
      ? over.id
      : over.data.current?.card?.column_id;
    const finalColumnId = currentCardData?.column_id || overColumnId;

    if (activeCardData && finalColumnId) {
      onMoveCard(activeId, finalColumnId, orderedCards);
    }

    setActiveCard(null);
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  return (
    <div className="kanban-board-container">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="kanban-board">
          <SortableContext 
            items={columns.map(col => col.id)} 
            strategy={horizontalListSortingStrategy}
          >
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                cards={orderedCards.filter((c) => c.column_id === col.id)}
                onCardClick={onCardClick}
                onAddCard={onAddCard}
              />
            ))}
          </SortableContext>
        </div>

        {createPortal(
          <DragOverlay dropAnimation={dropAnimation}>
            {activeCard && (
              <KanbanCard card={activeCard} onClick={() => {}} />
            )}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  );
};

export default KanbanBoard;
