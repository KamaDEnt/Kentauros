import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGmailSafeSendPolicy,
  buildProspectingPlan,
  calculateConversionReadiness,
  getLeadConversionSignals,
} from './leadConversionStrategy.js';

test('detects conversion signals from captured lead data', () => {
  const signals = getLeadConversionSignals({
    name: 'Clinica Alfa',
    website: 'https://clinicaalfa.com.br',
    email: 'contato@clinicaalfa.com.br',
    whatsapp: '11999999999',
    bodyText: 'Agende consulta pelo WhatsApp. Site responsivo e contato.',
  }, 'website_reformulation');

  assert.ok(signals.some(signal => signal.key === 'email'));
  assert.ok(signals.some(signal => signal.key === 'whatsapp'));
  assert.ok(signals.some(signal => signal.key === 'intent'));
});

test('builds prospecting plan based on conversion readiness', () => {
  const plan = buildProspectingPlan({
    score: 94,
    email: 'contato@empresa.com.br',
    phone: '1133334444',
    website: 'https://empresa.com.br',
    bodyText: 'orcamento contato whatsapp site',
  }, 'website_reformulation');

  assert.equal(plan.nextStage, 'qualified');
  assert.equal(plan.tier, 'hot');
  assert.ok(plan.actions[0].includes('Priorizar'));
});

test('keeps low readiness leads in new stage', () => {
  const result = calculateConversionReadiness({ score: 20 }, 'new_website');

  assert.equal(result.tier, 'cold');
  assert.ok(result.readiness < 62);
});

test('builds conservative Gmail policy for cold outreach', () => {
  const policy = buildGmailSafeSendPolicy({ workspaceAccount: true, coldOutreach: true });

  assert.equal(policy.provider, 'gmail');
  assert.ok(policy.recommendedDailyCap <= 120);
  assert.ok(policy.minDelaySeconds >= 45);
});
