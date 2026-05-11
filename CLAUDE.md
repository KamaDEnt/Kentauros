# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kentauros OS é um sistema operacional de gestão para consultorias de software (ERP/CRM), automatizando o ciclo de vida de projetos desde prospecção de leads até entrega e suporte, com auxílio de IA.

## Stack Tecnológica

- **Frontend**: React 19 (Vite)
- **Backend**: Express + Supabase (PostgreSQL)
- **Estado**: React Context API
- **Estilização**: CSS moderno com Glassmorphism
- **IA**: Sistema multi-agentes simulado (BA, UX, DEV, QA)

## Comandos de Desenvolvimento

```bash
npm run dev          # Inicia frontend + backend simultaneamente
npm run dev:frontend  # Apenas frontend (Vite)
npm run dev:backend   # Apenas backend (Express)
npm run build        # Build de produção
npm run lint         # Verificação de código
npm run preview      # Preview do build
```

## Deploy

O projeto está deployado na Vercel. Para fazer deploy:

```bash
npx vercel --prod
```

URL de produção: https://kentauros-os-app.vercel.app

## Estrutura de Pastas

```
src/
├── components/     # Componentes UI reutilizáveis (ui/, layout/, leads/, kanban/)
├── context/        # Estado global (DataContext, AppContext, I18nContext, etc.)
├── pages/          # Páginas da aplicação (Dashboard, Leads, Projects, Kanban, etc.)
├── services/       # Lógica de negócios (operationalWorkflow.js, ai/, leadCapture/)
├── hooks/          # Hooks customizados
├── data/           # Mocks de dados iniciais
└── locales/        # Traduções

server/
└── index.js        # Servidor Express (API, proxy SMTP)

supabase/
├── index.js        # Cliente Supabase
└── migrations/     # Migrações do banco de dados
```

## Arquitetura de Dados

- **Leads**: Prospecção e captura de clientes potenciais
- **Discoveries**: Reuniões de descoberta (kickoff)
- **Proposals**: Propostas comerciais
- **Projects**: Projetos em execução
- **Backlog**: Atividades do projeto
- **Kanban**: Fluxo operacional comcolunas (Discovery, UX, Dev, QA, Deploy)
- **QA Tests**: Cenários de teste

## Sistema de IA

Os 4 agentes geram artefatos em JSON que são salvos no campo `discovery_script` (JSONB) do Supabase:
1. **Agente BA**: Scripts de perguntas para Discovery
2. **Agente UX**: Lista de componentes de interface
3. **Agente DEV**: Stack técnica e componentes necessários
4. **Agente QA**: Cenários de teste em formato Gherkin

## Variáveis de Ambiente

O projeto usa `.env` com:
- `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` - Supabase
- `SMTP_USER` e `SMTP_PASS` - Configuração de email

## Padrões de Código

- Componentes funcionais com hooks
- Context API para estado global
- Nomes de arquivos em PascalCase para componentes, camelCase para serviços
- CSS com variáveis customizadas em `design-tokens.css` e `index.css`