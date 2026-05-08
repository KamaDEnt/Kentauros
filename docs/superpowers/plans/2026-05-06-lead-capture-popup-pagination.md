# Lead Capture Popup Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep capture results inside a responsive popup and paginate leads 10 at a time.

**Architecture:** Extract pagination math into a pure helper, then use it in `CaptureModal` step 3. Keep styling in `index.css` with existing Kentauros tokens.

**Tech Stack:** React 19, Vite, vanilla CSS, Node built-in test runner.

---

### Task 1: Pagination Helper

**Files:**
- Create: `src/components/leads/capturePagination.js`
- Create: `src/components/leads/capturePagination.test.js`

- [ ] Write failing tests for 10-item pages, page clamping, and empty result totals.
- [ ] Run `node --test src/components/leads/capturePagination.test.js` and confirm the helper import fails.
- [ ] Implement `LEAD_RESULTS_PAGE_SIZE` and `getPaginatedLeadResults`.
- [ ] Re-run `node --test src/components/leads/capturePagination.test.js`.

### Task 2: Capture Modal UI

**Files:**
- Modify: `src/components/leads/CaptureModal.jsx`
- Modify: `src/index.css`

- [ ] Import the pagination helper.
- [ ] Add `resultsPage` state and reset it when a new capture job starts or result count changes.
- [ ] Render only the current page in the step 3 table.
- [ ] Add pagination controls with previous/next buttons, current page, total pages, and range text.
- [ ] Add responsive classes for the results panel, stats, table, and pagination.

### Task 3: Verification

**Commands:**
- `node --test src/components/leads/capturePagination.test.js`
- `npm run build`

- [ ] Confirm both commands exit with code 0.
- [ ] Inspect `/leads` visually in a browser if the dev server can be started.
