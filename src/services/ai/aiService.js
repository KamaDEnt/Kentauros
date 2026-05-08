import { AGENT_PROMPTS } from './prompts';

class AIService {
  constructor() {
    this.logs = [];
    this.subscribers = [];
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(s => s(this.logs));
  }

  addLog(agentId, message, type = 'info', output = null) {
    const log = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      agentId,
      agentName: AGENT_PROMPTS[agentId]?.name || 'System',
      message,
      type,
      output
    };
    this.logs = [log, ...this.logs].slice(0, 50); // Keep last 50
    this.notify();
  }

  async runAgent(agentId, input) {
    const agent = AGENT_PROMPTS[agentId];
    if (!agent) throw new Error(`Agent ${agentId} not found.`);

    this.addLog(agentId, `Iniciando processamento com ${agent.name}...`, 'info');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    let text = '';
    let checklist = [];
    let discoveryScript = null;
    
    // Simulate generation based on agent type
    switch (agentId) {
      case 'BA':
        text = `# Refinamento BA - ${input.title}\n\n## Descrição Refinada\nO projeto foca em resolver a dor de ${input.description || 'processos manuais'} do cliente.\n\n## Critérios de Aceite\n1. Deve ser responsivo.\n2. Integração com API v3.\n\n## Riscos Identificados\n- Baixa disponibilidade da API legada.`;
        checklist = [
          { task: 'Validar requisitos com stakeholders', is_completed: false },
          { task: 'Definir KPIs de sucesso', is_completed: false },
          { task: 'Mapear processos AS-IS / TO-BE', is_completed: false }
        ];
        discoveryScript = [
          { question: "Quais são os 3 principais gargalos operacionais hoje?", answer: "" },
          { question: "Quem são os usuários finais que mais sofrerão impacto?", answer: "" },
          { question: "Existe alguma dependência técnica de sistemas legados?", answer: "" },
          { question: "Qual o orçamento estimado para a fase de MVP?", answer: "" },
          { question: "Qual a data crítica para o primeiro go-live?", answer: "" }
        ];
        break;
      case 'UX':
        text = `# Briefing UX/UI\n\n## Fluxo do Usuário\n1. Login -> Dashboard -> Gestão.\n\n## Componentes\n- Sidebar dinâmico\n- Cards com badges de risco\n- Modal de detalhes multi-abas`;
        checklist = [
          { task: 'Criar Wireframes de baixa fidelidade', is_completed: false },
          { task: 'Definir Guia de Estilo (Cores/Tipografia)', is_completed: false },
          { task: 'Validar protótipo navegável', is_completed: false }
        ];
        discoveryScript = [
          { item: 'Fluxo de Autenticação', status: 'pending', note: 'Necessário definir se terá OAuth.' },
          { item: 'Dashboard Principal', status: 'pending', note: 'Focar em visualização de dados.' },
          { item: 'Filtros Avançados', status: 'pending', note: 'UX para desktop e mobile.' }
        ];
        break;
      case 'DEV':
        text = `# Plano Técnico de Implementação\n\n## Arquitetura\n- Clean Architecture com React Context.\n\n## Entidades de Banco\n- kanban_cards, kanban_columns, kanban_agents.`;
        checklist = [
          { task: 'Configurar Schema do Banco de Dados', is_completed: false },
          { task: 'Implementar Endpoints da API', is_completed: false },
          { task: 'Configurar Testes Unitários', is_completed: false }
        ];
        discoveryScript = [
          { component: 'Backend API', tech: 'Node.js / Express', notes: 'Utilizar padrão Repository.' },
          { component: 'Database', tech: 'PostgreSQL', notes: 'Migrações via Supabase CLI.' },
          { component: 'Frontend', tech: 'React / Vite', notes: 'Context API para estado global.' }
        ];
        break;
      case 'QA':
        text = `# Cenários de Teste (Gherkin)\n\nScenario: Mover card para QA\n  Given que o card está em Desenvolvimento\n  And o checklist técnico está 100%\n  When o usuário move para QA\n  Then o card deve ser aceito.`;
        checklist = [
          { task: 'Executar Testes de Fumaça', is_completed: false },
          { task: 'Validar Critérios de Aceite', is_completed: false },
          { task: 'Realizar Teste de Regressão', is_completed: false }
        ];
        discoveryScript = [
          { scenario: 'Login Sucesso', steps: 'Inserir dados válidos -> Clicar entrar', expected: 'Redirecionar para Home' },
          { scenario: 'Mover Card Bloqueado', steps: 'Tentar mover card com checklist pendente', expected: 'Exibir alerta de erro' }
        ];
        break;
      case 'DEVOPS':
        text = `# Plano de Deploy\n\n- Backup de produção\n- Migração de banco\n- Purge de CDN\n\n**Rollback**: Reverter tag v1.2.0.`;
        checklist = [
          { task: 'Validar Variáveis de Ambiente', is_completed: false },
          { task: 'Executar Migrações de Produção', is_completed: false },
          { task: 'Monitorar Logs Pós-Deploy', is_completed: false }
        ];
        break;
      case 'SUPPORT':
        text = `# Triagem de Suporte\n\n**Classificação**: Bug Crítico\n**Prioridade**: ALTA\n**Resposta Sugerida**: "Já estamos analisando a intermitência no ambiente de homologação."`;
        checklist = [
          { task: 'Contatar cliente com status', is_completed: false },
          { task: 'Reproduzir bug em Staging', is_completed: false }
        ];
        break;
      default:
        text = 'Saída genérica gerada pelo agente.';
        checklist = [{ task: 'Revisar card', is_completed: false }];
    }

    const result = { text, checklist, discoveryScript };
    this.addLog(agentId, `Processamento concluído.`, 'success', text);
    return result;
  }

  getLogs() {
    return this.logs;
  }
}

export const aiService = new AIService();
