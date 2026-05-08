import { supabase } from './supabaseClient';

const GENERATION_STEPS = [
  'Inicializando OpenCode Engine...',
  'Lendo payload estruturado do protótipo...',
  '[IA] Analisando regras de negócio e requisitos funcionais...',
  '[IA] Mapeando estado global e fluxo de dados...',
  '[IA] Definindo arquitetura de componentes React (Atomic Design)...',
  'Acessando Base de Conhecimento de Componentes...',
  'Montando hierarquia de arquivos (Vite + React)...',
  'Gerando index.html e package.json...',
  '[IA] Escrevendo lógicas de estado e side-effects...',
  'Traduzindo estilos (CSS Variables e Layouts)...',
  'Construindo componentes de UI...',
  '[IA] Gerando hooks customizados e integrações de API...',
  'Otimizando performance (Code Splitting e Lazy Loading)...',
  'Aplicando linting e formatting de código...',
  'Finalizando empacotamento do projeto...',
];

const mockGeneratedFiles = (prototype) => {
  return {
    'package.json': `{
  "name": "${prototype.client_name.toLowerCase().replace(/\s+/g, '-')}",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.55.0",
    "vite": "^5.0.8"
  }
}`,
    'src/App.jsx': `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="hero">
        <h1>${prototype.extracted?.heroHeadline || prototype.client_name}</h1>
        <p>${prototype.extracted?.heroSubheadline || 'Soluções de alta qualidade.'}</p>
        <button className="cta-btn">Agendar Reunião</button>
      </header>
    </div>
  );
}

export default App;`,
    'src/App.css': `:root {
  --primary-color: ${prototype.palette?.primary || '#000000'};
  --secondary-color: ${prototype.palette?.secondary || '#ffffff'};
}

body {
  font-family: 'Inter', sans-serif;
  margin: 0;
  padding: 0;
  background-color: var(--secondary-color);
  color: #333;
}

.hero {
  background-color: var(--primary-color);
  color: white;
  padding: 4rem 2rem;
  text-align: center;
}

.cta-btn {
  background: white;
  color: var(--primary-color);
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}
`
  };
};

export const openCodeService = {
  GENERATION_STEPS,

  /**
   * Mock the execution of OpenCode Engine
   * @param {object} prototype - the approved prototype data
   * @param {function} onProgress - callback(stepText, progressPercentage)
   */
  async generateCode(prototype, onProgress) {
    const stepDelay = 800; // Simulated delay for realism
    
    // Simulate steps
    for (let i = 0; i < GENERATION_STEPS.length; i++) {
      onProgress(GENERATION_STEPS[i], Math.round(((i + 1) / GENERATION_STEPS.length) * 100));
      await new Promise(r => setTimeout(r, stepDelay));
    }

    const files = mockGeneratedFiles(prototype);
    
    const codeProject = {
      id: `code_${Date.now()}`,
      prototype_id: prototype.id,
      client_name: prototype.client_name,
      status: 'success', // success, error
      files,
      logs: GENERATION_STEPS.map(step => `[INFO] ${step}`),
      created_at: new Date().toISOString()
    };

    this.saveProject(codeProject);
    await this.createKanbanQACard(prototype, codeProject);

    return codeProject;
  },

  async createKanbanQACard(prototype, codeProject) {
    try {
      // 1. Find QA column or use the last column as fallback
      const { data: cols, error: colError } = await supabase
        .from('kanban_columns')
        .select('*')
        .order('order', { ascending: true });

      if (colError) throw colError;
      
      let qaColumn = cols.find(c => c.name.toLowerCase().includes('qa') || c.name.toLowerCase().includes('test'));
      if (!qaColumn) {
        qaColumn = cols[cols.length - 1]; // fallback to last column if QA not found
      }

      if (!qaColumn) return;

      // 2. Generate a card code
      const { data: cards, error: cardError } = await supabase
        .from('kanban_cards')
        .select('code')
        .order('created_at', { ascending: false })
        .limit(1);

      let nextNum = 1;
      if (cards && cards.length > 0 && cards[0].code) {
         nextNum = parseInt(cards[0].code.split('-')[1]) + 1;
      }
      const code = `KNT-${nextNum.toString().padStart(3, '0')}`;

      // 3. Insert card
      const description = `Código gerado automaticamente via OpenCode para o protótipo: **${prototype.client_name}**.
      
Por favor, acesse a aba "Code Generator" para baixar o pacote de código e realizar a validação do QA de acordo com os requisitos e o protótipo aprovado.`;

      const { data: newCard, error: insertError } = await supabase
        .from('kanban_cards')
        .insert({
          code,
          title: `[QA] Validação de Código - ${prototype.client_name}`,
          description,
          priority: 'high',
          column_id: qaColumn.id,
          status: 'active',
          ai_last_agent: 'DEV', // Emulating that DEV (OpenCode) finished
          ai_last_output: `OpenCode finalizou a geração com sucesso. ID do projeto: ${codeProject.id}`
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 4. Create Checklist
      const checklist = [
        { card_id: newCard.id, task: 'Verificar aderência visual ao protótipo', is_completed: false },
        { card_id: newCard.id, task: 'Testar responsividade mobile e desktop', is_completed: false },
        { card_id: newCard.id, task: 'Analisar performance (Lighthouse)', is_completed: false },
        { card_id: newCard.id, task: 'Garantir ausência de erros no console', is_completed: false }
      ];

      await supabase.from('kanban_card_checklists').insert(checklist);

    } catch (err) {
      console.error('Failed to create QA Kanban card:', err);
    }
  },

  getAllProjects() {
    try {
      return JSON.parse(localStorage.getItem('kentauros_opencode_projects') || '[]');
    } catch {
      return [];
    }
  },

  saveProject(project) {
    const all = this.getAllProjects();
    all.unshift(project);
    localStorage.setItem('kentauros_opencode_projects', JSON.stringify(all));
  }
};
