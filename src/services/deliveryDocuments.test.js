import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildProjectVersion,
  buildProposalDocument,
  buildQaEvidenceDocument,
  renderProposalDocumentText,
  renderQaEvidenceText,
} from './deliveryDocuments.js';

test('builds formal proposal document from discovery context', () => {
  const document = buildProposalDocument({
    proposal: { title: 'Proposta X', clientName: 'Cliente X', value: 15000, validUntil: '2026-05-20' },
    discovery: { summary: 'Resumo', decisions: ['Decisão A'], rules: ['Regra A'] },
  });

  assert.equal(document.clientName, 'Cliente X');
  assert.ok(document.sections.some(section => section.title === 'Escopo proposto'));
  assert.ok(renderProposalDocumentText(document).includes('Proposta X'));
});

test('builds project version snapshot', () => {
  const version = buildProjectVersion({ project: { id: 10, status: 'ready', progress: 20 }, source: 'test' });

  assert.equal(version.projectId, 10);
  assert.equal(version.source, 'test');
  assert.equal(version.progress, 20);
});

test('renders QA evidence document', () => {
  const document = buildQaEvidenceDocument({ item: { title: 'Teste Login', status: 'passed' }, projectName: 'Projeto A' });
  const text = renderQaEvidenceText(document);

  assert.equal(document.result, 'aprovado');
  assert.ok(text.includes('Projeto A'));
});
