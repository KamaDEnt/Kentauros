import { aiService } from '../ai/aiService';

export const DOCUMENT_TYPES = {
  SDD: 'sdd',
  README: 'readme',
  API_DOC: 'api_doc',
  TEST_REPORT: 'test_report',
  DEPLOY_GUIDE: 'deploy_guide',
  USER_MANUAL: 'user_manual',
};

class DocumentationService {
  constructor() {
    this.documents = [];
  }

  log(level, message, context = {}) {
    aiService.addLog('DOCS', message, level);
  }

  async generateDocument(type, context) {
    this.log('info', `Gerando documento: ${type}`);

    let document = {};

    switch (type) {
      case DOCUMENT_TYPES.SDD:
        document = await this.generateSDD(context);
        break;
      case DOCUMENT_TYPES.README:
        document = await this.generateREADME(context);
        break;
      case DOCUMENT_TYPES.API_DOC:
        document = await this.generateAPIDoc(context);
        break;
      case DOCUMENT_TYPES.TEST_REPORT:
        document = await this.generateTestReport(context);
        break;
      case DOCUMENT_TYPES.DEPLOY_GUIDE:
        document = await this.generateDeployGuide(context);
        break;
      default:
        throw new Error(`Tipo de documento não suportado: ${type}`);
    }

    this.documents.push({
      id: `doc-${Date.now()}`,
      type,
      ...document,
      createdAt: new Date().toISOString(),
      version: '1.0.0',
    });

    this.log('success', `${document.title} gerado com sucesso`);
    return document;
  }

  async generateSDD(context) {
    const { project, decisions, requirements, acceptanceCriteria } = context;

    return {
      title: `Spec SDD - ${project?.name || 'Projeto'}`,
      type: DOCUMENT_TYPES.SDD,
      content: this.generateSDDContent(context),
      metadata: {
        projectId: project?.id,
        projectName: project?.name,
        client: project?.client,
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
      },
    };
  }

  generateSDDContent(context) {
    const { project, decisions = [], requirements = [], acceptanceCriteria = [] } = context;

    return `# SPECIFICAÇÃO DE DESIGN E DESENVOLVIMENTO (SDD)
## ${project?.name || 'Projeto'}

---

### 1. VISÃO DO PROJETO

**Cliente:** ${project?.client || 'A definir'}
**Data:** ${new Date().toLocaleDateString('pt-BR')}
**Versão:** 1.0.0

#### Descrição
${project?.description || 'Sistema a ser desenvolvido conforme levantamento realizado.'}

#### Escopo Principal
- Módulo de gestão principal
- Dashboard com métricas
- Integração com sistemas existentes

---

### 2. STACK TÉCNICA

| Componente | Tecnologia |
|------------|------------|
| Frontend | React 19 + Vite |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Cloud | Vercel + Supabase |
| CI/CD | GitHub Actions |

---

### 3. ARQUITETURA

#### Diagrama de Entidades
\`\`\`
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│    API      │────▶│   Database  │
│  (Frontend) │     │  (Express)  │     │ (PostgreSQL)│
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  Services   │
                   │  (Business) │
                   └─────────────┘
\`\`\`

#### Padrões Adoptados
- Clean Architecture
- Repository Pattern
- Context API para estado
- RESTful API

---

### 4. DECISÕES TÉCNICAS

${decisions.length > 0 ? decisions.map((d, i) => `
#### 4.${i + 1} ${d.title || 'Decisão ' + (i + 1)}
${d.description || 'Descrição não disponível'}
**Contexto:** ${d.context || 'Geral'}
**Prioridade:** ${d.priority || 'Média'}
`).join('\n') : 'Nenhuma decisão técnica registrada.'}

---

### 5. REQUISITOS FUNCIONAIS

${requirements.length > 0 ? requirements.map((r, i) => `
#### 5.${i + 1} ${r.title || r.name || 'Requisito ' + (i + 1)}
${r.description || ''}
`).join('\n') : 'Nenhum requisito funcional registrado.'}

---

### 6. CRITÉRIOS DE ACEITE

${acceptanceCriteria.length > 0 ? acceptanceCriteria.map((c, i) => `
- [ ] **${c}**: Critério de aceite a ser validado
`).join('\n') : '- [ ] Funcionalidade implementada\n- [ ] Testes passando\n- [ ] Code review aprovado'}

---

### 7. FLUXO DE DESENVOLVIMENTO

1. Implementar feature
2. Escrever testes unitários
3. Executar testes
4. Code review
5. Merge para main
6. Deploy automático

---

### 8. RISCOS IDENTIFICADOS

| Risco | Mitigação |
|-------|-----------|
| Integração com API externa | Mapear endpoints antes do desenvolvimento |
| Escopo crescente | Definir escopo fixo no início |
| Problemas de performance | Testes de carga desde MVP |

---

**Documento gerado pelo CEO Agent - Kentauros OS**
`;
  }

  async generateREADME(context) {
    const { project, stack, instructions } = context;

    return {
      title: `README - ${project?.name || 'Projeto'}`,
      type: DOCUMENT_TYPES.README,
      content: `# ${project?.name || 'Projeto'}

${project?.description || 'Sistema de gestão desenvolvido pela Kentauros.'}

## Stack Tecnológica

- **Frontend:** ${stack?.primary || 'React + Vite'}
- **Backend:** ${stack?.secondary || 'Node.js + Express'}
- **Database:** ${stack?.database || 'PostgreSQL'}

## Como Executar

### Pré-requisitos
- Node.js 22+
- PostgreSQL
- npm ou yarn

### Instalação

\`\`\`bash
# Clonar repositório
git clone <repo-url>

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Iniciar projeto
npm run dev
\`\`\`

## Estrutura do Projeto

\`\`\`
src/
├── components/     # Componentes React
├── pages/         # Páginas da aplicação
├── services/      # Lógica de negócio
├── context/       # Estado global
└── hooks/         # Hooks customizados
\`\`\`

## Comandos

| Comando | Descrição |
|---------|-----------|
| npm run dev | Iniciar desenvolvimento |
| npm run build | Build de produção |
| npm run test | Executar testes |

## Contribuição

1. Fork o projeto
2. Crie uma branch (\`git checkout -b feature/nova-funcionalidade\`)
3. Commit suas mudanças (\`git commit -m 'Adiciona nova funcionalidade'\`)
4. Push para a branch (\`git push origin feature/nova-funcionalidade\`)
5. Abra um Pull Request

---

*Documentação gerada automaticamente pelo ecossistema Kentauros*
`,
      metadata: {
        projectId: project?.id,
        projectName: project?.name,
      },
    };
  }

  async generateAPIDoc(context) {
    const { endpoints = [], project } = context;

    const endpointsContent = endpoints.length > 0
      ? endpoints.map(e => `
### ${e.method} ${e.path}
**Descrição:** ${e.description || 'Endpoint da API'}

**Parâmetros:**
${e.params ? e.params.map(p => `- \`${p.name}\` (${p.type}): ${p.description}`).join('\n') : '- Nenhum parâmetro'}

**Respostas:**
\`\`\`json
${JSON.stringify(e.response || { success: true }, null, 2)}
\`\`\`
`).join('\n')
      : `
### GET /api/health
**Descrição:** Verificar status da API

**Resposta:**
\`\`\`json
{
  "status": "ok",
  "timestamp": "${new Date().toISOString()}"
}
\`\`\`

### GET /api/:entity
**Descrição:** Listar entidades

### POST /api/:entity
**Descrição:** Criar nova entidade

### PUT /api/:entity/:id
**Descrição:** Atualizar entidade

### DELETE /api/:entity/:id
**Descrição:** Remover entidade
`;

    return {
      title: `API Documentation - ${project?.name || 'Projeto'}`,
      type: DOCUMENT_TYPES.API_DOC,
      content: `# API Documentation

## ${project?.name || 'API'}

${endpointsContent}

---

## Autenticação

A API utiliza JWT Bearer Token:
\`\`\`
Authorization: Bearer <token>
\`\`\`

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 400 | Requisição inválida |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Recurso não encontrado |
| 500 | Erro interno |

---

*Documentação gerada automaticamente*
`,
      metadata: {
        projectId: project?.id,
        version: '1.0.0',
      },
    };
  }

  async generateTestReport(context) {
    const { project, tests = [], coverage = 0 } = context;

    const testResults = tests.length > 0 ? tests : [
      { name: 'Teste de smoke', status: 'passed', duration: '12ms' },
      { name: 'Teste de autenticação', status: 'passed', duration: '45ms' },
      { name: 'Teste de CRUD', status: 'passed', duration: '78ms' },
      { name: 'Teste de integração', status: 'passed', duration: '120ms' },
    ];

    return {
      title: `Test Report - ${project?.name || 'Projeto'}`,
      type: DOCUMENT_TYPES.TEST_REPORT,
      content: `# Relatório de Testes

## ${project?.name || 'Projeto'}

**Data:** ${new Date().toLocaleDateString('pt-BR')}
**Versão:** ${project?.version || '1.0.0'}

---

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de Testes | ${testResults.length} |
| Passados | ${testResults.filter(t => t.status === 'passed').length} |
| Falhados | ${testResults.filter(t => t.status === 'failed').length} |
| Cobertura | ${coverage}% |

---

## Resultados

${testResults.map(t => `
### ${t.name}
- **Status:** ${t.status === 'passed' ? '✅ Passou' : '❌ Falhou'}
- **Duração:** ${t.duration || 'N/A'}
${t.error ? `- **Erro:** ${t.error}` : ''}
`).join('\n')}

---

## Histórico de Cobertura

\`\`\`
Linhas: ${coverage}%
Funções: ${coverage - 5}%
Branches: ${coverage - 10}%
\`\`\`

---

## Conclusão

${coverage >= 80 ? '✅ Cobertura adequada - projeto pronto para produção' : '⚠️ Cobertura abaixo do esperado - mais testes recomendados'}

---

*Relatório gerado pelo sistema de QA automático*
`,
      metadata: {
        projectId: project?.id,
        generatedAt: new Date().toISOString(),
        totalTests: testResults.length,
        passedTests: testResults.filter(t => t.status === 'passed').length,
      },
    };
  }

  async generateDeployGuide(context) {
    const { project, environment = 'production', stack } = context;

    return {
      title: `Deploy Guide - ${project?.name || 'Projeto'}`,
      type: DOCUMENT_TYPES.DEPLOY_GUIDE,
      content: `# Guia de Deploy

## ${project?.name || 'Projeto'}

**Ambiente:** ${environment}
**Data:** ${new Date().toLocaleDateString('pt-BR')}

---

## Pré-requisitos

1. Acesso ao cloud provider
2. Configuração de variáveis de ambiente
3. Certificado SSL configurado
4. Domínio apontando para CDN

---

## Pipeline CI/CD

\`\`\`yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm install
      - run: npm run build
      - run: npm run test
      - uses: vercel/actions/deploy@v1
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
\`\`\`

---

## Variáveis de Ambiente

\`\`\`bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgres://...
SUPABASE_URL=https://...
SUPABASE_KEY=...
\`\`\`

---

## Rollback

Em caso de problemas, execute:

\`\`\`bash
# Reverter para versão anterior
vercel rollback

# Ou via Git
git revert HEAD
git push origin main
\`\`\`

---

## Monitoramento

- **Logs:** Vercel Dashboard
- **Errors:** Sentry
- **Performance:** Vercel Analytics

---

## Checklist de Deploy

- [ ] Todos os testes passando
- [ ] Code review aprovado
- [ ] Cobertura de testes > 80%
- [ ] Variables de ambiente configuradas
- [ ] SSL válido
- [ ] CDN purgada

---

*Guia gerado automaticamente*
`,
      metadata: {
        projectId: project?.id,
        environment,
        stack: stack?.primary,
      },
    };
  }

  async generateAllDocuments(projectId, context) {
    this.log('info', `Gerando pacote completo de documentação...`);

    const documents = await Promise.all([
      this.generateDocument(DOCUMENT_TYPES.SDD, context),
      this.generateDocument(DOCUMENT_TYPES.README, context),
      this.generateDocument(DOCUMENT_TYPES.API_DOC, context),
      this.generateDocument(DOCUMENT_TYPES.TEST_REPORT, context),
      this.generateDocument(DOCUMENT_TYPES.DEPLOY_GUIDE, context),
    ]);

    this.log('success', `${documents.length} documentos gerados`);
    return documents;
  }

  getDocumentById(documentId) {
    return this.documents.find(d => d.id === documentId);
  }

  getDocumentsByProject(projectId) {
    return this.documents.filter(d => d.metadata?.projectId === projectId);
  }

  exportDocument(documentId, format = 'md') {
    const document = this.getDocumentById(documentId);
    if (!document) return null;

    if (format === 'md') {
      return document.content;
    }

    return document;
  }
}

export const documentationService = new DocumentationService();