import test from 'node:test';
import assert from 'node:assert/strict';

import { LEAD_RESULTS_PAGE_SIZE, getPaginatedLeadResults } from './capturePagination.js';

const makeResults = (count) => Array.from({ length: count }, (_, index) => ({
  id: index + 1,
  name: `Lead ${index + 1}`,
}));

test('uses 10 leads per results page', () => {
  assert.equal(LEAD_RESULTS_PAGE_SIZE, 10);
});

test('returns the requested page of lead results', () => {
  const page = getPaginatedLeadResults(makeResults(25), 2);

  assert.equal(page.totalPages, 3);
  assert.equal(page.currentPage, 2);
  assert.equal(page.startItem, 11);
  assert.equal(page.endItem, 20);
  assert.deepEqual(page.pageResults.map(lead => lead.id), [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
});

test('clamps out-of-range pages to valid bounds', () => {
  const lowPage = getPaginatedLeadResults(makeResults(12), -3);
  const highPage = getPaginatedLeadResults(makeResults(12), 99);

  assert.equal(lowPage.currentPage, 1);
  assert.equal(highPage.currentPage, 2);
  assert.deepEqual(highPage.pageResults.map(lead => lead.id), [11, 12]);
});

test('reports an empty range when there are no results', () => {
  const page = getPaginatedLeadResults([], 1);

  assert.equal(page.totalPages, 1);
  assert.equal(page.currentPage, 1);
  assert.equal(page.startItem, 0);
  assert.equal(page.endItem, 0);
  assert.deepEqual(page.pageResults, []);
});
