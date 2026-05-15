# Ecossistema de Captura de Leads - Kentauros OS

## Visão Geral

O sistema de captura de leads da Kentauros é responsável por encontrar empresas (leads) com base em um nicho e localização, extrair seus dados de contato (email, telefone, site) e prepará-los para envio de emails de prospecção.

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                           │
│                                                                      │
│  ┌──────────────────┐    ┌──────────────────────────────────────┐   │
│  │   Leads.jsx      │───▶│       CaptureModal.jsx               │   │
│  │  (Página Leads)  │    │  - Interface do usuário             │   │
│  │                   │    │  - Step 1: Configuração             │   │
│  │ Botão Captura    │    │  - Step 2: Loading (spinner)         │   │
│  │ Automática       │    │  - Step 3: Resultados               │   │
│  └──────────────────┘    │  - Step 4: Preview email             │   │
│                          │  - Step 5: Disparo                   │   │
│                          └──────────────┬───────────────────────┘   │
└─────────────────────────────────────────│───────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND SERVICES                               │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              LeadCaptureService.js (Frontend)                │   │
│  │  - Envia configuração para API backend                      │   │
│  │  - Gerencia estado dos jobs de captura                       │   │
│  │  - Recebe e processa resultados                              │   │
│  └────────────────────────────┬──────────────────────────────────┘   │
│                               │                                      │
│  ┌────────────────────────────┴──────────────────────────────────┐   │
│  │                    EmailService.js                             │   │
│  │  - Gera HTML do email de prospecção                           │   │
│  │  - Envia emails via API externa                               │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  OUTROS SERVIÇOS:                                                   │
│  - leadCaptureInsights.js (cálculo de valor estimado)              │
│  - captureOwnership.js (controle de propriedade do lead)           │
│  - leadConversionStrategy.js (plano de conversão)                  │
└─────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼ (HTTP POST)
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND API (Vercel)                            │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                   api/leads/capture.ts                         │ │
│  │                                                                 │ │
│  │  FLUXO:                                                        │ │
│  │                                                                 │ │
│  │  1. Recebe params (niche, location, quantity)                 │ │
│  │         │                                                      │ │
│  │         ▼                                                     │ │
│  │  2. Tenta fontes reais (Bing, Google, SerpAPI)                │ │
│  │         │                                                      │ │
│  │         ▼                                                     │ │
│  │  3. Se não tiver API key → Banco Local (dados mock)           │ │
│  │         │                                                      │ │
│  │         ▼                                                     │ │
│  │  4. Scraping dos sites (extrai email/telefone)                │ │
│  │         │                                                      │ │
│  │         ▼                                                     │ │
│  │  5. Filtra por requisitos (email obrigatório?)                │ │
│  │         │                                                      │ │
│  │         ▼                                                     │ │
│  │  6. Calcula score e retorna resultados                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  VARIÁVEIS DE AMBIENTE (Vercel):                                    │
│  - VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (banco de dados)      │
│  - BING_SEARCH_API_KEY (busca real - opcional)                      │
│  - SERPAPI_API_KEY (Google - opcional)                              │
│  - GOOGLE_PLACES_API_KEY (Google Maps - opcional)                  │
└─────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SUPABASE (PostgreSQL)                         │
│                                                                      │
│  TABELAS RELACIONADAS:                                             │
│  - leads (leads capturados/importados)                              │
│  - captured_leads_registry (controle de duplicados)                 │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Fluxo Completo de Captura

### Step 1: Configuração (Frontend)
O usuário seleciona:
- **Métrica de captura**: reformulação de site, novo site, correção
- **Nicho**: escritórios de advocacia, contabilidade, academias, etc.
- **Localização**: Rio de Janeiro, São Paulo, Brasil, etc.
- **Quantidade**: 10, 20, 30, 50, 100 leads
- **Requisitos de contato**: email (obrigatório), telefone, WhatsApp, website

### Step 2: Requisição ao Backend
O `LeadCaptureService.js` envía um POST para `/api/leads/capture`:

```javascript
{
  captureRunId: "uuid-gerado",
  niche: "escritórios de advocacia",
  location: "Rio de Janeiro, RJ",
  quantity: 20,
  captureMetric: "website_reformulation",
  contactRequirements: { email: true }
}
```

### Step 3: Processamento no Backend (capture.ts)

#### 3.1 Verificação de Fontes Reais
O sistema verifica se há API keys configuradas:
- Bing Search API (BING_SEARCH_API_KEY)
- SerpAPI (SERPAPI_API_KEY)
- Google Places (GOOGLE_PLACES_API_KEY)

**Se tiver API key**: Usa a API para buscar leads reais
**Se não tiver**: Usa o banco de dados local (dados mock para demo)

#### 3.2 Banco de Dados Local
O banco local contém Nichos pré-definidos:
- escritórios de advocacia
- contabilidade
- consultorias
- academias
- personal trainers
- restaurantes
- nutricionistas
- clínicas médicas
- ecommerce

Cada nicho tem empresas com:
- name (nome da empresa)
- domain (domínio do site)
- city (cidade)
- state (estado: RJ, SP, MG, PR, RS, PE, DF)
- desc (descrição)
- category (categoria)

#### 3.3 Scraping de Sites
Após encontrar os leads, o sistema faz scraping de cada site para extrair:
- **Email**: Extraído via regex do HTML
- **Telefone**: Extraído via regex (formato brasileiro)
- **Redes Sociais**: LinkedIn, Instagram, Facebook, WhatsApp
- **Detecção de SPA**: Identifica sites que precisam de JavaScript

**Importante**:
- Se o scraping falhar, os dados originais são preservados
- Sites SPA (React, Vue, Next.js) são marcados como `requiresApiKey: true`
- O scraping NÃO sobrescreve dados existentes (só enriquece)

#### 3.4 Filtragem por Requisitos
O sistema filtra os leads com base nos `contactRequirements`:
- Se email é obrigatório: remove leads sem email válido
- Se website é obrigatório: remove leads sem URL válida

#### 3.5 Cálculo de Score
Cada lead recebe um score de 0-100 baseado em:
- Plataforma do site (Wix: +30, WordPress: +25, Shopify: +15)
- Email disponível: +10
- Telefone disponível: +5
- WhatsApp disponível: +10
- Fonte confiável (Google Places: +10, Bing: +8)

### Step 4: Retorno ao Frontend
O backend retorna:
```javascript
{
  success: true,
  captureRunId: "uuid",
  qualified: [/* leads */],
  qualifiedCount: 20,
  totalFound: 25,
  stats: {
    candidatesFound: 25,
    leadsQualified: 20,
    // ...
  },
  scraping: {
    totalScraped: 20,
    successfulScrapes: 15,
    needsApiKey: 2
  }
}
```

### Step 5: Exibição dos Resultados (Frontend)
O modal mostra:
- Total de leads encontrados
- Leads qualificados (com email)
- Score médio
- Métrica de captura usada
- Lista paginada dos leads com:
  - Nome da empresa
  - Score (barra de progresso)
  - Canais disponíveis (email, telefone)
  - Status (válido/sem email/inválido)

### Step 6: Importação e Disparo de Emails
O usuário pode:
1. **Selecionar leads** para importar para sua carteira
2. **Revisar email** - configurar template do email
3. **Iniciar automação** - enviar emails com intervalo (evitar spam)

## Estrutura de Arquivos

### Backend (API)
```
api/leads/
├── capture.ts              # API principal de captura
└── save-for-future-contact.ts  # Salvar leads para contato futuro
```

### Frontend Services
```
src/services/leadCapture/
├── LeadCaptureService.js    # Cliente HTTP para API de captura
├── EmailService.js          # Geração e envio de emails
├── leadCaptureInsights.js   # Cálculo de valor estimado
├── captureOwnership.js      # Controle de propriedade
├── leadConversionStrategy.js # Plano de conversão
├── LeadDeduplicationService.js # Remove duplicados
├── RealWebsiteAnalyzer.js   # Analisa sites reais
└── WebsiteValidatorService.js  # Valida URLs
```

### Frontend Components
```
src/components/leads/
├── CaptureModal.jsx        # Modal de captura (principal)
└── capturePagination.js    # Paginação dos resultados
```

### Páginas
```
src/pages/
└── Leads.jsx               # Página de leads com botão de captura
```

## Variáveis de Ambiente

### Produção (Vercel)
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
BING_SEARCH_API_KEY=...      # Opcional - para busca real
SERPAPI_API_KEY=...          # Opcional - para Google
GOOGLE_PLACES_API_KEY=...    # Opcional - para Maps
```

### Desenvolvimento (.env.local)
```
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=...
```

## Pontos de Extensão

### Adicionar novo nicho
Editar `LOCAL_DATABASE` em `api/leads/capture.ts`:
```javascript
const LOCAL_DATABASE = {
  'novo-nicho': [
    { name: 'Empresa 1', domain: 'empresa1.com.br', city: 'São Paulo', state: 'SP', desc: 'Descrição', category: 'categoria' },
    // ...
  ],
  // ...
};
```

### Adicionar nova fonte de busca
1. Adicionar API key no CONFIG
2. Criar função de busca (ex: searchWithSerp, searchWithGooglePlaces)
3. Integrar no fluxo principal (após Bing, antes do banco local)

### Customizar extração de dados
Editar função `scrapeWebsiteData` em `api/leads/capture.ts` para:
- Adicionar mais campos extraídos
- Melhorar regex de extração
- Adicionar detecção de mais tipos de dados

### Customizar scoring
Editar função `calculateScore` em `api/leads/capture.ts` para:
- Adicionar novos critérios
- Mudar pesos existentes
- Incluir dados externos (ex: dados da empresa)

## Problemas Comuns e Soluções

### "Nenhum lead encontrado"
- Verificar se o nicho existe no banco local
- Verificar se a localização é suportada (RJ, SP, MG, PR, RS, PE, DF)
- Em produção: configurar API keys para fontes reais

### "Nenhum lead atende aos requisitos"
- O email é obrigatório por padrão
- Tentar desativar o requisito de email
- Verificar se o scraping está funcionando

### Leads duplicados
- O sistema verifica duplicados via Supabase (captured_leads_registry)
- O scraping pode encontrar o mesmo lead de diferentes fontes

### Scraping falha para sites SPA
- Sites React/Vue/Angular são marcados como `requiresApiKey: true`
- Para esses casos, configurar Apify ou ScraperAPI (custo adicional)

## Testes

```bash
# Rodar testes unitários
npm test

# Testar API local
npm run dev
# Acesse http://localhost:5173/api/leads/capture

# Verificar logs na Vercel
npx vercel logs kentauros-os-app
```