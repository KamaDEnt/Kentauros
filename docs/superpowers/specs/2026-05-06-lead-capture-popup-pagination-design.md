# Lead Capture Popup Pagination Design

## Goal

Make the lead capture results easier to use by keeping the results inside an aligned, responsive popup and showing captured leads in pages of 10.

## Design

The existing `CaptureModal` flow remains unchanged: configure, scan, select results, preview email, and send automation. The results step becomes a constrained results panel inside the modal, using the current Kentauros dark surface, raised cards, subtle borders, gold accents, and success status styling.

The results table shows 10 leads per page. Selection still stores lead ids globally, so moving between pages does not lose selected leads. The select-all checkbox continues to operate across all valid leads with email, matching the current behavior.

## Responsiveness

On desktop, the modal uses a wider `xl` layout for the results step. The result cards and table stay aligned inside a single column. On mobile, summary cards stack, the table scrolls horizontally when needed, and pagination controls wrap without overlapping.

## Testing

Pagination math is extracted into a small helper and covered with Node's built-in test runner. The UI is verified with a production build and, when possible, browser inspection at desktop and mobile widths.
