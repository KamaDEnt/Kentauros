# Kentauros OS - Contexto do Projeto

Este documento serve como a "Fonte da Verdade" (Single Source of Truth) para o desenvolvimento do Kentauros OS, detalhando a arquitetura, funcionalidades e o estado atual da aplicação.

## 🚀 Visão Geral
O **Kentauros OS** é um sistema operacional de gestão para consultorias de software, focado em automatizar o ciclo de vida de projetos: desde a prospecção de leads até a entrega e suporte, com forte auxílio de inteligência artificial.

## 🛠️ Stack Tecnológica
- **Frontend**: React (Vite)
- **Estilização**: Vanilla CSS (Moderno, com variáveis CSS e Glassmorphism)
- **Gerenciamento de Estado**: React Context API
- **Roteamento**: React Router DOM
- **IA**: Sistema de Multi-Agentes Simulado (Pronto para integração com APIs externas)

## 🏗️ Arquitetura de Pastas
```text
src/
├── components/       # Componentes de UI reutilizáveis (Card, Button, Modal, etc.)
├── context/          # Provedores de estado global (AppContext, DataContext)
├── data/             # Mocks de dados iniciais
├── hooks/            # Hooks customizados (useWorkflow, usePermissions)
├── pages/            # Páginas da aplicação (Dashboard, Discovery, UX, etc.)
├── services/         # Lógica de negócios e serviços (AI Service)
└── App.jsx           # Roteamento e estrutura principal
```

## 🤖 Sistema de Agentes de IA (Especializados)
Implementamos uma camada de inteligência com quatro agentes distintos que operam em sequência, integrados diretamente ao **Kanban Inteligente**:

1.  **Agente BA (Business Analyst)**: Atua no Discovery. Gera scripts de perguntas estruturadas e gerencia respostas do cliente.
2.  **Agente UX (Designer)**: Transforma requisitos em uma lista de componentes de interface com status de prototipagem.
3.  **Agente DEV (Developer)**: Define a stack técnica e detalha os componentes técnicos necessários para a implementação.
4.  **Agente QA (Quality Assurance)**: Cria cenários de teste em formato Gherkin (Dado/Quando/Então) baseados no escopo.

### Componentes de IA:
- **`aiService.js`**: Gerencia a lógica de execução, gera artefatos estruturados em JSON e mantém logs de eventos.
- **`AIConsole.jsx`**: Interface global para acompanhar os logs de IA.
- **Artefatos Estruturados**: Cada agente gera dados que são persistidos e podem ser editados manualmente na aba de "Insights" de cada card no Kanban.

## 📂 Módulos Implementados
- **Kanban Inteligente**: O coração operacional do sistema.
    - **Orquestração Automática**: Mover um card para uma coluna específica (ex: UX Design) aciona automaticamente o agente correspondente.
    - **Persistência em JSONB**: Todos os artefatos gerados por IA são acumulados e salvos na coluna `discovery_script` do Supabase.
    - **Validação de Fluxo**: Regras de negócio impedem que cards avancem para QA ou Concluído se houver itens de checklist pendentes.
- **Dashboard**: Visão geral de métricas e performance.
- **Discovery / Leads / UX / Dev / QA**: Módulos especializados que se conectam ao fluxo do Kanban.

## 📝 Próximos Passos
- Implementar sistema de bloqueio e detecção automática de impedimentos nos cards.
- Conectar os agentes a modelos de linguagem reais (Gemini/OpenAI).
- Implementar notificações em tempo real quando um agente conclui uma tarefa.
- Criar o módulo de Billing e Financeiro.

---
*Última Atualização: 04 de Maio de 2026*
