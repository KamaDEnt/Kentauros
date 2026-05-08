import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CAPTURE_METRICS,
  analyzeLeadForMetric,
  calculateAiDevelopmentEstimatedValue,
  calculateCaptureScore,
  formatIssuesAsHtmlList,
} from './leadCaptureInsights.js';

const lead = {
  name: 'DataFlow',
  website: 'https://dataflow.com.br',
  email: 'contato@dataflow.com.br',
  phone: '(11) 99999-0000',
};

test('puts website reformulation as the first capture metric', () => {
  assert.equal(CAPTURE_METRICS[0].value, 'website_reformulation');
});

test('generates improvement points for the selected capture metric', () => {
  const analysis = analyzeLeadForMetric(lead, 'website_reformulation');

  assert.equal(analysis.metric, 'website_reformulation');
  assert.ok(analysis.issues.length >= 3);
  assert.ok(analysis.issues.every(issue => issue.title && issue.description && issue.impact));
});

test('capture score is based on selected metric issues and contact readiness', () => {
  const reformulation = calculateCaptureScore(lead, 'website_reformulation');
  const creation = calculateCaptureScore({ ...lead, website: null }, 'new_website');

  assert.ok(reformulation >= 70);
  assert.ok(creation > reformulation);
});

test('estimated value uses AI development pricing range', () => {
  const value = calculateAiDevelopmentEstimatedValue({ ...lead, score: 90 }, 'website_reformulation');

  assert.ok(value >= 4500);
  assert.ok(value < 50000);
  assert.equal(value % 500, 0);
});

test('formats identified problems as a concise email-safe phrase', () => {
  const copy = formatIssuesAsHtmlList([
    { title: 'Chamadas para ação fracas', description: 'O site não conduz o visitante para contato.' },
    { title: 'Performance prejudicando conversão', description: 'O carregamento pode reduzir conversões.' },
  ]);

  assert.equal(copy, 'chamada para contato, velocidade de carregamento');
  assert.doesNotMatch(copy, /<ul/);
});
