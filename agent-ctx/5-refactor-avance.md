# Task 5: Refactor avance-view.tsx into smaller sub-components

## Summary
Refactored the monolithic `avance-view.tsx` (1374 lines) into 6 focused files totaling 1611 lines, with the main orchestrator reduced to 469 lines (66% reduction).

## Files Created
1. `src/components/avance/avance-types.ts` (38 lines) — Shared types & constants
2. `src/components/avance/avance-filters.tsx` (94 lines) — Filter bar component
3. `src/components/avance/avance-table.tsx` (269 lines) — Data table + pagination
4. `src/components/avance/avance-form-fields.tsx` (268 lines) — Shared form fields
5. `src/components/avance/avance-dialogs.tsx` (473 lines) — All 5 dialog components

## File Modified
- `src/components/avance/avance-view.tsx` — Replaced with slim orchestrator (469 lines)

## Key Decisions
- `AvanceFormFields` uses `isEdit` boolean to toggle between Add/Edit behavior, eliminating duplicated form JSX
- `uploadingFiles` and `setFilePreviews` kept in dialog props (used in footers) but removed from AvanceFormFields (not needed in form rendering)
- All state management stays in the orchestrator; sub-components are pure presentational
- Lint passes clean with zero errors
