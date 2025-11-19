# Tasks — Spec 10: Account Detail Page Extensions

> NOTE: This file defines the **structure only**. Concrete tasks will be filled in later (e.g., via `/speckit.tasks`).

## Phase 0 — Research & Clarifications

- [ ] T001 Review Spec 000, Spec 008, and Spec 009 for architecture, data model, and existing account detail behaviour.
- [ ] T002 Capture any open questions or assumptions for Spec 10 in `spec.md` section 10 (Open Questions).

## Phase 1 — Design & API Contracts

- [ ] T010 Finalise API contracts for `GET /api/accounts/{id}/detail` (extended), contacts, demos, notes, and activity-log endpoints.
- [ ] T011 Align DTO shapes and error codes with Spec 000 conventions.

## Phase 2 — Backend Implementation

- [ ] T020 Implement or extend the `GET /api/accounts/{id}/detail` endpoint to include all required fields and counts.
- [ ] T021 Implement child tab data endpoints for contacts, demos, notes, and activity log, with RBAC and ownership enforcement.

## Phase 3 — Frontend Implementation

- [ ] T030 Implement tabbed UI in `frontend/src/app/(admin)/accounts/[id]/page.tsx` with lazy loading per tab.
- [ ] T031 Implement breadcrumb and UX states (loading, empty, error) for each tab.

## Phase 4 — Testing & Validation

- [ ] T040 Add or update manual test scripts/integration tests covering 403/404/500 flows and RBAC behaviour.
- [ ] T041 Verify performance and UX on accounts with large numbers of child records.

## Phase 5 — Polish & Documentation

- [ ] T050 Update any relevant docs or quickstart guides to include the extended Account Detail Page behaviour.
- [ ] T051 Confirm spec alignment and mark completed tasks in this file.
