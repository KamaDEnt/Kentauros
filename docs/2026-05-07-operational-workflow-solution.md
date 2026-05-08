# Solucao Das Tasks Operacionais

## Objetivo

Transformar a Kentauros em um fluxo operacional unico: captura de lead, discovery, proposta, projeto, backlog, UX/UI, desenvolvimento, QA, deploy e dashboard usando os mesmos dados persistidos por usuario, perfil e projeto.

## Modelo Central

Criar uma camada unica de dados operacionais no Supabase:

- `users`: usuario, e-mail, tenant, tags/perfis (`ADMIN`, `DEV`, `QA`, `UX`, `COMERCIAL`).
- `clients`: clientes e empresas.
- `leads`: leads capturados, status, fonte, score e contatos.
- `discoveries`: reunioes, audios, transcricoes, decisoes, regras e tags.
- `proposals`: propostas geradas, valores, documentos, status e cliente associado.
- `projects`: projetos originados de proposta assinada e apta para inicio.
- `project_tasks`: atividades ordenadas do projeto.
- `automation_runs`: execucoes automaticas por IA.
- `sdd_specs`: specs, decisoes, criterios de aceite e aprovacoes.
- `qa_validations`: testes, evidencias, documentacao e aprovacao.
- `deployments`: pacotes, repositorio Git, passos executados e status.
- `audit_logs`: historico de decisao e acao por usuario.

Todas as telas devem consumir essa camada, sem valores fixos/mock quando houver dado real.

## 1. Dashboard

Solução:
- Substituir KPIs fixos por agregadores reais de `leads`, `projects`, `project_tasks`, `proposals`, `qa_validations`, `deployments` e `automation_runs`.
- Receita deve vir de propostas assinadas/aprovadas.
- Pipeline deve refletir contagem real por etapa: lead, discovery, proposta, assinado, projeto, QA, deploy.
- Atividade recente deve vir de `audit_logs`.
- Botao Atualizar Dados deve refazer consultas e atualizar cache local.

Resultado esperado:
- Dashboard sempre igual ao estado real do sistema.

## 2. Kanban

Solução:
- Corrigir persistencia de criacao e movimentacao dos cards em `kanban_cards`.
- Ao mover card, salvar `column_id`, ordem, status e historico em `kanban_card_history`.
- Novo card deve herdar tenant, projeto, cliente e coluna inicial.
- Ao entrar em colunas de agente (`Discovery`, `UX/UI`, `Desenvolvimento`, `QA`, `Deploy`), registrar evento e gerar artefatos da IA.

Resultado esperado:
- Recarregar a tela nao perde card criado nem movimentacao.

## 3. Discovery

Solução:
- Discovery vira wiki operacional/admin.
- Salvar audios e gravacoes em Storage.
- Salvar transcricao, resumo, decisoes, requisitos, regras e tags em `discoveries`.
- Somente `ADMIN` acessa a tela.
- Criar busca por cliente, projeto, tag e palavra-chave.
- Cada decisao vira insumo para proposta, projeto, backlog, UX/UI, desenvolvimento, QA e deploy.

Resultado esperado:
- Discovery passa a ser a fonte de conhecimento do projeto.

## 4. Propostas

Solução:
- Proposta deve nascer de cliente/lead com tag `reuniao_realizada` ou `reuniao_confirmada`.
- Gerador usa Discovery como contexto: dores, escopo, decisoes, requisitos e criterios.
- Proposta deve conter valores, escopo, prazo, documentos e status.
- Ao marcar como `assinada`, criar projeto automaticamente como `assinado` e `apto_para_inicio`.

Resultado esperado:
- Proposta nao fica solta; ela nasce de reuniao validada e vira projeto quando assinada.

## 5. Projetos

Solução:
- Projetos listam apenas propostas `assinadas` e `aptas_para_inicio`.
- Card de projeto abre:
  - resumo do Discovery;
  - decisoes registradas;
  - atividades ordenadas;
  - responsaveis;
  - riscos;
  - criterios de aceite.
- Ordem das atividades vem das decisoes e dependencias extraidas no Discovery.

Resultado esperado:
- DEV sabe exatamente o que construir e por que aquela ordem existe.

## 6. Backlog

Solução:
- Backlog mostra somente atividades de projetos aceitos atribuidadas ao DEV logado pelo e-mail.
- Ao iniciar/retirar uma atividade, abrir modal de confirmacao com prompt gerado:
  - contexto do projeto;
  - atividade;
  - requisitos;
  - arquivos/telas esperados;
  - criterios de aceite;
  - instrucoes para IA externa;
  - opcao futura `Executar pelo ecossistema Kentauros`.
- Salvar escolha do DEV e gerar registro em `automation_runs`.

Resultado esperado:
- Cada DEV controla apenas o que e dele e recebe prompt pronto antes de iniciar.

## 7. UX/UI

Solução:
- Tela UX/UI deve consumir Discovery e backlog para listar demandas visuais.
- Cada item deve apontar origem: reuniao, decisao, cliente, projeto e atividade.
- Mostrar sugestoes de cores, telas, componentes, imagens, layout, melhorias funcionais e criterios de aprovacao.
- Quando automacao gerar algo relacionado a UX/UI, criar item pendente para o DEV/UX validar.

Resultado esperado:
- Solicitações visuais do cliente viram checklist validavel de UX/UI.

## 8. Desenvolvimento

Solução:
- Acesso apenas a usuarios com tag `DEV`.
- Tela acompanha execucao automatica em formato SDD:
  - spec;
  - decisoes da IA;
  - arquivos alterados;
  - riscos;
  - perguntas pendentes;
  - aprovacoes do DEV.
- DEV aprova/reprova cada decisao antes do fluxo seguir.

Resultado esperado:
- Desenvolvimento automatico fica auditavel e controlado pelo DEV.

## 9. QA

Solução:
- Corrigir tela em branco e carregar validacoes reais.
- QA deve mostrar atividades desenvolvidas pela IA, testes executados, evidencias e documentacao gerada.
- DEV aprova se a entrega esta de acordo com teste e documentacao.
- Reprovacoes voltam para Desenvolvimento com motivo.

Resultado esperado:
- QA vira etapa de validacao real antes do deploy.

## 10. Deploy

Solução:
- Deploy lista atividades do projeto, status de QA, pacote gerado e passos executados pela IA.
- DEV pode baixar projeto/pacote para testar localmente.
- Vincular repositorio Git ao projeto.
- Permitir abrir projeto, ver logs, baixar release e registrar push/deploy.
- Deploy so libera quando QA estiver aprovado.

Resultado esperado:
- DEV consegue validar, versionar e publicar com rastreabilidade.

## Ordem De Implementacao

1. Criar modelo de dados e repositorio central.
2. Corrigir permissoes por tag (`ADMIN`, `DEV`, `QA`, `UX`).
3. Corrigir persistencia do Kanban.
4. Corrigir Dashboard com dados reais.
5. Implementar Discovery como base de conhecimento.
6. Conectar Propostas -> Projetos.
7. Conectar Projetos -> Backlog.
8. Implementar telas DEV: UX/UI, Desenvolvimento, QA e Deploy.
9. Adicionar auditoria e historico de decisao.
10. Validar fluxo completo ponta a ponta.

## Primeiro Marco Recomendado

O primeiro marco deve entregar:

- Dashboard com dados reais.
- Kanban salvando card e movimentacao.
- Permissoes por tag.
- Discovery com estrutura de wiki/admin.
- Propostas assinadas criando projetos.

Depois disso, implementar o fluxo DEV completo: Projetos, Backlog, UX/UI, Desenvolvimento, QA e Deploy.
