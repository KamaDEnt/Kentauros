import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProjectAcceptancePlan, getSignedReadyProjects } from './operationalWorkflow.js';

test('projects page lists only signed or ready-to-start projects', () => {
  const projects = [
    { id: 1, name: 'Projeto em andamento', client: 'Cliente A', status: 'active' },
    { id: 2, name: 'Projeto pronto', client: 'Cliente B', status: 'kickoff' },
  ];
  const proposals = [
    { id: 3, title: 'Proposta Cliente C', clientName: 'Cliente C', status: 'signed', value: 90000 },
    { id: 4, title: 'Proposta Cliente D', clientName: 'Cliente D', status: 'sent', value: 70000 },
  ];

  const result = getSignedReadyProjects(projects, proposals, [], []);

  assert.deepEqual(result.map(project => project.client), ['Cliente C', 'Cliente B']);
});

test('project acceptance assigns existing backlog to the logged developer', () => {
  const user = { id: 8, email: 'dev@kentauros.com' };
  const backlog = [
    { id: 10, projectId: 2, title: 'Implementar painel', status: 'todo', order: 2 },
    { id: 11, projectId: 2, title: 'Configurar API', status: 'blocked', order: 1 },
  ];

  const plan = buildProjectAcceptancePlan({
    project: { id: 2, name: 'Projeto pronto', client: 'Cliente B' },
    user,
    backlog,
  });

  assert.equal(plan.creates.length, 0);
  assert.deepEqual(plan.updates.map(item => item.id), [11, 10]);
  assert.ok(plan.updates.every(item => item.data.assignee === 8));
  assert.ok(plan.updates.every(item => item.data.assigneeEmail === 'dev@kentauros.com'));
  assert.ok(plan.updates.every(item => item.data.acceptedByDeveloperId === 8));
});

test('project acceptance generates ordered backlog when IA has no persisted tasks yet', () => {
  const plan = buildProjectAcceptancePlan({
    project: {
      id: 'proposal-7',
      name: 'Portal Comercial',
      client: 'Cliente C',
      discovery: {
        decisions: ['Validar autenticação com o cliente.', 'Gerar painel executivo responsivo.'],
      },
    },
    user: { id: 9, email: 'ana.dev@kentauros.com' },
    backlog: [],
  });

  assert.equal(plan.updates.length, 0);
  assert.equal(plan.creates.length, 4);
  assert.deepEqual(plan.creates.map(item => item.order), [1, 2, 3, 4]);
  assert.ok(plan.creates.every(item => item.projectId === 'proposal-7'));
  assert.ok(plan.creates.every(item => item.assigneeEmail === 'ana.dev@kentauros.com'));
});
