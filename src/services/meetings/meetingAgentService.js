import { aiService } from '../ai/aiService';

export const MEETING_TYPES = {
  DISCOVERY: 'discovery',
  KICKOFF: 'kickoff',
  FOLLOWUP: 'followup',
  RETROSPECTIVE: 'retrospective',
  STANDUP: 'standup',
};

export const MEETING_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

class MeetingAgentService {
  constructor() {
    this.meetings = [];
    this.subscribers = [];
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  notify(event, data) {
    this.subscribers.forEach(s => s({ event, data, timestamp: new Date().toISOString() }));
  }

  log(level, message, context = {}) {
    aiService.addLog('MEETING', message, level);
    this.notify('log', { level, message, ...context });
  }

  async createMeeting(meetingData) {
    this.log('info', `Criando reunião: ${meetingData.title}`);

    const meeting = {
      id: `meeting-${Date.now()}`,
      title: meetingData.title,
      type: meetingData.type || MEETING_TYPES.DISCOVERY,
      clientName: meetingData.clientName,
      projectId: meetingData.projectId,
      leadId: meetingData.leadId,
      scheduledAt: meetingData.scheduledAt,
      duration: meetingData.duration || 60,
      status: MEETING_STATUS.SCHEDULED,
      participants: meetingData.participants || [],
      agenda: meetingData.agenda || [],
      transcription: [],
      decisions: [],
      actionItems: [],
      summary: null,
      createdAt: new Date().toISOString(),
    };

    this.meetings.push(meeting);
    this.log('success', `Reunião criada para ${meetingData.clientName}`);
    this.notify('meeting_created', { meeting });

    return meeting;
  }

  async startMeeting(meetingId) {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) {
      throw new Error('Reunião não encontrada');
    }

    meeting.status = MEETING_STATUS.IN_PROGRESS;
    meeting.startedAt = new Date().toISOString();

    this.log('info', `Iniciando reunião: ${meeting.title}`);
    this.notify('meeting_started', { meeting });

    return meeting;
  }

  async addTranscriptionNote(meetingId, note) {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) {
      throw new Error('Reunião não encontrada');
    }

    meeting.transcription.push({
      id: `note-${Date.now()}`,
      text: note,
      timestamp: new Date().toISOString(),
      speaker: note.speaker || 'Système',
    });

    this.notify('transcription_added', { meetingId, note });
    return meeting;
  }

  async extractDecisions(meetingId) {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) {
      throw new Error('Reunião não encontrada');
    }

    this.log('info', `Extraindo decisões da reunião...`);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const decisions = this.generateDecisionsFromTranscript(meeting.transcription);

    meeting.decisions = decisions;
    meeting.decisionsExtractedAt = new Date().toISOString();

    this.log('success', `${decisions.length} decisões extraídas`, { decisions });
    this.notify('decisions_extracted', { meetingId, decisions });

    return decisions;
  }

  generateDecisionsFromTranscript(transcription) {
    if (!transcription.length) {
      return [
        {
          id: `dec-${Date.now()}`,
          text: 'Definir stack tecnológica após validação de requisitos',
          context: 'Tecnologia',
          priority: 'high',
          status: 'pending',
        },
        {
          id: `dec-${Date.now() + 1}`,
          text: 'Aprovar MVP com funcionalidades core primeiro',
          context: 'Escopo',
          priority: 'high',
          status: 'pending',
        },
        {
          id: `dec-${Date.now() + 2}`,
          text: 'Estabelecer cronograma de entregas quinzenais',
          context: 'Cronograma',
          priority: 'medium',
          status: 'pending',
        },
      ];
    }

    return transcription.map((note, index) => ({
      id: `dec-${Date.now()}-${index}`,
      text: `Decisão ${index + 1}: ${note.text.substring(0, 100)}...`,
      context: this.detectContext(note.text),
      priority: this.detectPriority(note.text),
      status: 'pending',
      sourceNoteId: note.id,
    }));
  }

  detectContext(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('tecnologia') || lowerText.includes('stack') || lowerText.includes('dev')) {
      return 'Tecnologia';
    }
    if (lowerText.includes('design') || lowerText.includes('ux') || lowerText.includes('tela')) {
      return 'Design';
    }
    if (lowerText.includes('prazo') || lowerText.includes('entrega') || lowerText.includes('deadline')) {
      return 'Cronograma';
    }
    if (lowerText.includes('valor') || lowerText.includes('budget') || lowerText.includes('custo')) {
      return 'Financeiro';
    }
    return 'Geral';
  }

  detectPriority(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('urgente') || lowerText.includes('imediato') || lowerText.includes('crítico')) {
      return 'high';
    }
    if (lowerText.includes('importante') || lowerText.includes('prioridade')) {
      return 'medium';
    }
    return 'low';
  }

  async generateActionItems(meetingId) {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) {
      throw new Error('Reunião não encontrada');
    }

    this.log('info', `Gerando action items...`);

    const actionItems = meeting.decisions.map((decision, index) => ({
      id: `action-${Date.now()}-${index}`,
      description: `Implementar: ${decision.text}`,
      context: decision.context,
      priority: decision.priority,
      status: 'pending',
      assignee: null,
      deadline: this.calculateDeadline(decision.priority),
      relatedDecisionId: decision.id,
    }));

    meeting.actionItems = actionItems;
    meeting.actionItemsGeneratedAt = new Date().toISOString();

    this.log('success', `${actionItems.length} action items gerados`);
    this.notify('action_items_generated', { meetingId, actionItems });

    return actionItems;
  }

  calculateDeadline(priority) {
    const baseDate = new Date();
    switch (priority) {
      case 'high':
        baseDate.setDate(baseDate.getDate() + 3);
        break;
      case 'medium':
        baseDate.setDate(baseDate.getDate() + 7);
        break;
      default:
        baseDate.setDate(baseDate.getDate() + 14);
    }
    return baseDate.toISOString();
  }

  async generateSummary(meetingId) {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) {
      throw new Error('Reunião não encontrada');
    }

    this.log('info', `Gerando resumo da reunião...`);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const summary = {
      title: `Resumo: ${meeting.title}`,
      duration: this.calculateDuration(meeting),
      participants: meeting.participants.length,
      keyDecisions: meeting.decisions.length,
      actionItems: meeting.actionItems.length,
      overview: this.generateOverview(meeting),
      nextSteps: this.generateNextSteps(meeting),
      risks: this.generateRisks(meeting),
      generatedAt: new Date().toISOString(),
    };

    meeting.summary = summary;
    meeting.status = MEETING_STATUS.COMPLETED;
    meeting.completedAt = new Date().toISOString();

    this.log('success', 'Resumo gerado com sucesso');
    this.notify('summary_generated', { meetingId, summary });

    return summary;
  }

  calculateDuration(meeting) {
    if (!meeting.startedAt) return 0;
    const end = meeting.completedAt || new Date().toISOString();
    const start = new Date(meeting.startedAt);
    return Math.round((new Date(end) - start) / 60000);
  }

  generateOverview(meeting) {
    return `Reunião de ${meeting.type} com ${meeting.clientName}. ` +
      `Foram identificadas ${meeting.decisions.length} decisões principais ` +
      `e ${meeting.actionItems.length} ações a serem executadas.`;
  }

  generateNextSteps(meeting) {
    return meeting.actionItems
      .filter(item => item.priority === 'high')
      .map(item => item.description);
  }

  generateRisks(meeting) {
    const risks = [];

    if (meeting.decisions.length > 5) {
      risks.push('Alto volume de decisões - risco de escopo crescente');
    }

    if (meeting.actionItems.some(item => item.priority === 'high')) {
      risks.push('Action items de alta prioridade requerem atenção imediata');
    }

    return risks.length ? risks : ['Nenhum risco identificado'];
  }

  getMeetingById(meetingId) {
    return this.meetings.find(m => m.id === meetingId);
  }

  getMeetingsByProject(projectId) {
    return this.meetings.filter(m => m.projectId === projectId);
  }

  getMeetingsByLead(leadId) {
    return this.meetings.filter(m => m.leadId === leadId);
  }

  getUpcomingMeetings() {
    return this.meetings
      .filter(m => m.status === MEETING_STATUS.SCHEDULED)
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  }

  getCompletedMeetings() {
    return this.meetings
      .filter(m => m.status === MEETING_STATUS.COMPLETED)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  }

  async runFullPipeline(meetingId) {
    this.log('info', `Executando pipeline completo da reunião...`);

    await this.startMeeting(meetingId);
    await this.extractDecisions(meetingId);
    await this.generateActionItems(meetingId);
    const summary = await this.generateSummary(meetingId);

    this.log('success', 'Pipeline completo executado');
    this.notify('pipeline_completed', { meetingId, summary });

    return summary;
  }
}

export const meetingAgentService = new MeetingAgentService();