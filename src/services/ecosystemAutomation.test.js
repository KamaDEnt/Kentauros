import test from 'node:test';
import assert from 'node:assert/strict';
import { createAutomationLog, runAutomationAction } from './ecosystemAutomation.js';

test('automation schedules follow-up for qualified lead', () => {
  let updated = null;
  const result = runAutomationAction({
    automation: { action: 'schedule_commercial_followup' },
    data: { leads: [{ id: 1, company: 'Lead A', status: 'qualified' }], backlog: [], qaTests: [] },
    actions: {
      updateLead: (id, data) => { updated = { id, data }; },
      addQaTest: () => {},
      addDeployment: () => {},
    },
  });

  assert.equal(result.status, 'success');
  assert.equal(updated.id, 1);
  assert.equal(updated.data.followUpStatus, 'scheduled');
});

test('automation creates QA test from review backlog', () => {
  const result = runAutomationAction({
    automation: { action: 'create_qa_test' },
    data: { leads: [], backlog: [{ id: 7, projectId: 3, title: 'Tela de login', status: 'review' }], qaTests: [] },
    actions: {
      updateLead: () => {},
      addQaTest: (data) => ({ id: 'qa-1', ...data }),
      addDeployment: () => {},
    },
  });

  assert.equal(result.status, 'success');
  assert.equal(result.entityId, 'qa-1');
});

test('automation log contains timestamp and status', () => {
  const log = createAutomationLog('success', 'ok');

  assert.equal(log.status, 'success');
  assert.ok(log.createdAt);
});
