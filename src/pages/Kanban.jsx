import React, { useState, useEffect } from 'react';
import KanbanBoard from '../components/kanban/KanbanBoard';
import KanbanCardModal from '../components/kanban/KanbanCardModal';
import { supabase } from '../services/supabaseClient';
import { aiService } from '../services/ai/aiService';
import { useData } from '../context/DataContext';
import { useI18n } from '../context/I18nContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';
import { 
  Search, 
  Plus, 
  RefreshCw,
  LayoutGrid
} from 'lucide-react';

const DEFAULT_TENANT_ID = '27704bfd-2750-4595-a54a-3e47045fcdf4';
const KANBAN_CACHE_KEY = 'kentauros_kanban_cards_cache';

const readKanbanCache = () => {
  try {
    return JSON.parse(localStorage.getItem(KANBAN_CACHE_KEY) || '[]');
  } catch {
    return [];
  }
};

const writeKanbanCache = (cards) => {
  const withIndex = cards.map((card, index) => ({ ...card, local_order: index }));
  localStorage.setItem(KANBAN_CACHE_KEY, JSON.stringify(withIndex));
  return withIndex;
};

const mergeWithLocalCache = (remoteCards) => {
  const cachedCards = readKanbanCache();
  if (!cachedCards.length) return remoteCards;

  const remoteById = new Map(remoteCards.map(card => [card.id, card]));
  const merged = cachedCards
    .filter(card => remoteById.has(card.id) || card.local_pending)
    .map(card => ({
      ...(remoteById.get(card.id) || {}),
      ...card,
      local_pending: card.local_pending && !remoteById.has(card.id),
    }));

  remoteCards.forEach(card => {
    if (!merged.some(item => item.id === card.id)) {
      merged.push(card);
    }
  });

  return merged.sort((a, b) => (a.local_order ?? 9999) - (b.local_order ?? 9999));
};

const Kanban = () => {
  const { t } = useI18n();
  const { projects, clients } = useData();
  const [columns, setColumns] = useState([
    { id: 'discovery', name: 'Discovery', order: 1 },
    { id: 'ux', name: 'UX Design', order: 2 },
    { id: 'dev', name: 'Desenvolvimento', order: 3 },
    { id: 'qa', name: 'QA', order: 4 },
    { id: 'deploy', name: 'Deploy', order: 5 },
  ]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [targetColumnId, setTargetColumnId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch columns from Supabase
      const { data: cols, error: colError } = await supabase
        .from('kanban_columns')
        .select('*')
        .order('order', { ascending: true });

      if (!colError && cols && cols.length > 0) {
        setColumns(cols);
      }

      // Fetch cards with related data
      const { data: cardData, error: cardError } = await supabase
        .from('kanban_cards')
        .select(`
          *,
          kanban_card_checklists(*)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: true });

      if (!cardError && cardData && cardData.length > 0) {
        // Transform data for the UI
        const transformedCards = cardData.map(card => ({
          ...card,
          checklist_count: card.kanban_card_checklists?.length || 0,
          checklist_done: card.kanban_card_checklists?.filter(i => i.is_completed).length || 0
        }));

        const mergedCards = mergeWithLocalCache(transformedCards);
        setCards(mergedCards);
        writeKanbanCache(mergedCards);
      } else {
        // Use local cache if no data from Supabase
        const cachedCards = readKanbanCache();
        if (cachedCards.length) {
          setCards(cachedCards);
        }
      }
    } catch (err) {
      console.error('Error fetching Kanban data:', err);
      // Try to use local cache on error
      const cachedCards = readKanbanCache();
      if (cachedCards.length) {
        setCards(cachedCards);
      }
    } finally {
      setLoading(false);
    }
  };

  const runAgentForCard = async (card, stageName) => {
    let agentId = null;
    const name = stageName.toLowerCase();
    
    if (name.includes('ba') || name.includes('discovery')) agentId = 'BA';
    else if (name.includes('ux') || name.includes('design')) agentId = 'UX';
    else if (name.includes('dev') || name.includes('desenvolvimento')) agentId = 'DEV';
    else if (name.includes('qa') || name.includes('test')) agentId = 'QA';
    else if (name.includes('deploy')) agentId = 'DEVOPS';
    else if (name.includes('suporte')) agentId = 'SUPPORT';

    if (agentId) {
      setCards(prev => prev.map(c => 
        c.id === card.id ? { ...c, is_ai_running: true } : c
      ));

      aiService.addLog('System', `Card ${card.code} entrou em ${stageName}. Acionando ${agentId} Agent...`, 'info');
      const result = await aiService.runAgent(agentId, card);
      
      // Merge with existing artifacts to avoid data loss when moving between agents
      const existingArtifacts = card.discovery_script || {};
      const updatedArtifacts = {
        ...existingArtifacts,
        [agentId]: result.discoveryScript
      };

      await supabase.from('kanban_cards').update({
        ai_last_output: result.text,
        ai_last_agent: agentId,
        discovery_script: updatedArtifacts,
        updated_at: new Date().toISOString()
      }).eq('id', card.id);

      // Add suggested checklist items if any
      if (result.checklist?.length > 0) {
        const checklistData = result.checklist.map(item => ({
          card_id: card.id,
          task: item.task,
          is_completed: false
        }));
        await supabase.from('kanban_card_checklists').insert(checklistData);
      }

      // Save to history table too
      await supabase.from('kanban_agent_runs').insert({
        card_id: card.id,
        agent_id: agentId,
        status: 'completed',
        input: card,
        output: result.text
      });

      // Update local state and re-fetch to get new checklist
      fetchData();
    }
  };

  const handleMoveCard = async (cardId, newColumnId, orderedSnapshot = null) => {
    try {
      const card = cards.find(c => c.id === cardId);
      if (!card) return;
      const oldColumnId = card.column_id;

      const targetColumn = columns.find(col => col.id === newColumnId);
      
      // Business Rule: Validate checklist for QA/Done
      if (targetColumn && (targetColumn.name.includes('QA') || targetColumn.name.includes('Concluído'))) {
        const { data: checklist } = await supabase
          .from('kanban_card_checklists')
          .select('*')
          .eq('card_id', cardId);
        
        const hasUnfinished = checklist?.some(item => !item.is_completed);
        if (hasUnfinished) {
          alert(t('kanban.alert.blocked', `Bloqueio: O card {{code}} possui itens pendentes no checklist e não pode avançar para {{target}}.`, { code: card.code, target: targetColumn.name }));
          return;
        }
      }

      const updatedAt = new Date().toISOString();
      const optimisticCards = writeKanbanCache((orderedSnapshot?.length ? orderedSnapshot : cards).map(item =>
        item.id === cardId
          ? { ...item, column_id: newColumnId, stage: targetColumn?.name || null, updated_at: updatedAt }
          : item
      ));
      setCards(optimisticCards);

      if (oldColumnId === newColumnId) return;

      // Update in Supabase
      const { error } = await supabase
        .from('kanban_cards')
        .update({ 
          column_id: newColumnId,
          stage: targetColumn?.name || null,
          updated_at: updatedAt
        })
        .eq('id', cardId);

      if (error) throw error;

      // Log history
      await supabase.from('kanban_card_history').insert({
        card_id: cardId,
        action: 'move',
        from_column_id: oldColumnId,
        to_column_id: newColumnId,
        tenant_id: card.tenant_id || targetColumn?.tenant_id || DEFAULT_TENANT_ID
      });

      // Trigger AI logic
      if (targetColumn) {
        runAgentForCard({ ...card, column_id: newColumnId, stage: targetColumn.name }, targetColumn.name);
      } else {
        fetchData();
      }

    } catch (err) {
      console.error('Error moving card:', err);
    }
  };

  const handleSaveCard = async (formData) => {
    try {
      if (selectedCard) {
        const updatedAt = new Date().toISOString();
        const updatedCard = {
          ...selectedCard,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          risk_score: formData.risk_score,
          project_id: formData.project_id || null,
          client_id: formData.client_id || null,
          discovery_script: formData.discovery_script || {},
          is_blocked: formData.is_blocked || false,
          block_reason: formData.block_reason || '',
          impact_score: formData.impact_score || 0,
          urgency_score: formData.urgency_score || 0,
          updated_at: updatedAt,
          kanban_card_checklists: formData.checklist || [],
        };
        setCards(prev => writeKanbanCache(prev.map(card => card.id === selectedCard.id ? updatedCard : card)));

        // Update Existing
        const { error: cardError } = await supabase
          .from('kanban_cards')
          .update({
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            risk_score: formData.risk_score,
            project_id: formData.project_id || null,
            client_id: formData.client_id || null,
            discovery_script: formData.discovery_script || {},
            is_blocked: formData.is_blocked || false,
            block_reason: formData.block_reason || '',
            impact_score: formData.impact_score || 0,
            urgency_score: formData.urgency_score || 0,
            updated_at: updatedAt
          })
          .eq('id', selectedCard.id);

        if (cardError) throw cardError;

        // Sync Checklists (Delete all and re-insert for simplicity in this version)
        await supabase.from('kanban_card_checklists').delete().eq('card_id', selectedCard.id);
        
        if (formData.checklist?.length > 0) {
          const checklistData = formData.checklist.map(item => ({
            card_id: selectedCard.id,
            task: item.title || item.task,
            is_completed: item.is_completed
          }));
          await supabase.from('kanban_card_checklists').insert(checklistData);
        }
      } else {
        // Create New
        const lastCard = [...cards].sort((a, b) => b.created_at?.localeCompare(a.created_at))[0];
        const nextNum = lastCard ? parseInt(lastCard.code.split('-')[1]) + 1 : 1;
        const code = `KNT-${nextNum.toString().padStart(3, '0')}`;

        const { data: newCard, error: createError } = await supabase
          .from('kanban_cards')
          .insert({
            code,
            title: formData.title,
            description: formData.description,
            type: formData.type || 'technical_task',
            priority: formData.priority,
            risk_score: formData.risk_score || 0,
            impact_score: formData.impact_score || 0,
            urgency_score: formData.urgency_score || 0,
            is_blocked: formData.is_blocked || false,
            block_reason: formData.block_reason || '',
            column_id: targetColumnId || columns[0].id,
            project_id: formData.project_id || null,
            client_id: formData.client_id || null,
            status: 'active',
            stage: columns.find(col => col.id === (targetColumnId || columns[0].id))?.name || 'Entrada',
            tenant_id: columns.find(col => col.id === (targetColumnId || columns[0].id))?.tenant_id || DEFAULT_TENANT_ID
          })
          .select()
          .single();

        if (createError) throw createError;

        setCards(prev => writeKanbanCache([...prev, {
          ...newCard,
          kanban_card_checklists: formData.checklist || [],
          checklist_count: formData.checklist?.length || 0,
          checklist_done: 0,
        }]));

        if (formData.checklist?.length > 0) {
          const checklistData = formData.checklist.map(item => ({
            card_id: newCard.id,
            task: item.title || item.task,
            is_completed: false
          }));
          await supabase.from('kanban_card_checklists').insert(checklistData);
        }

        await supabase.from('kanban_card_history').insert({
          card_id: newCard.id,
          action: 'create',
          to_column_id: newCard.column_id,
          tenant_id: newCard.tenant_id || DEFAULT_TENANT_ID
        });
      }

      setIsModalOpen(false);
      const cachedCards = readKanbanCache();
      if (cachedCards.length) {
        setCards(cachedCards);
      }
      fetchData();
    } catch (err) {
      console.error('Error saving card:', err);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm(t('kanban.confirm.delete', 'Tem certeza que deseja excluir este card?'))) return;
    try {
      const nextCards = cards.filter(card => card.id !== cardId);
      setCards(writeKanbanCache(nextCards));
      await supabase.from('kanban_cards').update({ status: 'deleted' }).eq('id', cardId);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error deleting card:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCardClick = (card) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const handleAddCard = (columnId) => {
    setSelectedCard(null);
    setTargetColumnId(columnId);
    setIsModalOpen(true);
  };

  const filteredCards = cards.filter(card => {
    const matchesSearch = card.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         card.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <RefreshCw className="animate-spin text-gold" size={48} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader 
        title={
          <div className="flex items-center gap-3">
            <LayoutGrid className="text-gold" size={32} />
            {t('kanban.title')}
          </div>
        }
        subtitle={t('kanban.subtitle')}
        actions={
          <>
            <Input 
              placeholder={t('kanban.searchCards')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
              wrapperClassName="w-64"
            />
            <Button variant="secondary" onClick={fetchData}>
              <RefreshCw size={16} />
            </Button>
            <Button onClick={() => handleAddCard(columns[0]?.id)}>
              <Plus size={16} />
              {t('kanban.newCard')}
            </Button>
          </>
        }
      />

      <KanbanBoard 
        columns={columns} 
        cards={filteredCards} 
        onMoveCard={handleMoveCard}
        onCardClick={handleCardClick}
        onAddCard={handleAddCard}
      />

      <KanbanCardModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        card={selectedCard}
        onSave={handleSaveCard}
        onDelete={handleDeleteCard}
        projects={projects}
        clients={clients}
      />
    </div>
  );
};

export default Kanban;
