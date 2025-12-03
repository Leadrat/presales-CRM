# Tasks: Spec 019 – Analytics Dashboard

## Phase 1 – Setup

- [ ] T001 Initialize analytics feature branch context (already on `019-analytics-dashboard` but confirm) in repo root `C:/Users/shash/Desktop/Pre- Sales`
- [ ] T002 Ensure backend project builds after adding `AnalyticsController` in `backend/Controllers/AnalyticsController.cs`
- [ ] T003 Ensure frontend project builds and tests run in `frontend/` (baseline check before analytics work)

## Phase 2 – Foundational Backend Analytics Infrastructure

- [ ] T004 Add 12‑month date range validation helper and error response pattern in `backend/Controllers/AnalyticsController.cs`
- [ ] T005 Apply soft‑delete filters (`IsDeleted == false` on accounts and demos) consistently in all analytics queries in `backend/Controllers/AnalyticsController.cs`
- [ ] T006 Implement effective user filter logic (Admin vs Basic current user) as a reusable helper method in `backend/Controllers/AnalyticsController.cs`

## Phase 3 – [US1] View Account KPIs (Created / Modified / Booked / Lost)

- [ ] T007 [US1] Implement `GET /api/analytics/accounts` action method skeleton in `backend/Controllers/AnalyticsController.cs`
- [ ] T008 [US1] Parse `from`, `to`, `userId` query parameters and enforce 12‑month maximum range in `backend/Controllers/AnalyticsController.cs`
- [ ] T009 [US1] Implement `created` count query using `CreatedAt` and `CreatedByUserId` filters in `backend/Controllers/AnalyticsController.cs`
- [ ] T010 [US1] Implement `modified` count query using `UpdatedAt` filters in `backend/Controllers/AnalyticsController.cs`
- [ ] T011 [US1] Implement `booked` count query using `DealStage == "WON"` and `ClosedDate` filters in `backend/Controllers/AnalyticsController.cs`
- [ ] T012 [US1] Implement `lost` count query using `DealStage == "LOST"` and `ClosedDate` filters in `backend/Controllers/AnalyticsController.cs`
- [ ] T013 [US1] Return response payload `{ data: { created, modified, booked, lost } }` from `GET /api/analytics/accounts` in `backend/Controllers/AnalyticsController.cs`
- [ ] T014 [US1] Add integration tests for `GET /api/analytics/accounts` covering Admin global, Admin with `userId`, and Basic user scoping in `backend/Tests/Integration/Analytics/AccountsAnalyticsTests.cs`
- [ ] T015 [US1] Add integration tests for `GET /api/analytics/accounts` date-range behavior and 12‑month validation in `backend/Tests/Integration/Analytics/AccountsAnalyticsTests.cs`

## Phase 4 – [US2] View Demos by Account Size Buckets

- [ ] T016 [US2] Implement `GET /api/analytics/demos-by-size` action method skeleton in `backend/Controllers/AnalyticsController.cs`
- [ ] T017 [US2] Parse `from`, `to`, `userId` query parameters and enforce 12‑month maximum range reuse in `backend/Controllers/AnalyticsController.cs`
- [ ] T018 [US2] Implement demo date filter logic (Scheduled → `ScheduledAt`, Completed → `DoneAt`) in `backend/Controllers/AnalyticsController.cs`
- [ ] T019 [US2] Implement size bucket mapping based on `Account.NumberOfUsers` into Little/Small/Medium/Enterprise in `backend/Controllers/AnalyticsController.cs`
- [ ] T020 [US2] Group demos by size bucket and compute counts using EF Core `GroupBy` + `Count` in `backend/Controllers/AnalyticsController.cs`
- [ ] T021 [US2] Initialize missing buckets to 0 and return payload `{ data: { little, small, medium, enterprise } }` from `GET /api/analytics/demos-by-size` in `backend/Controllers/AnalyticsController.cs`
- [ ] T022 [US2] Add integration tests verifying demo bucketing and counts for multiple accounts and sizes in `backend/Tests/Integration/Analytics/DemosBySizeAnalyticsTests.cs`
- [ ] T023 [US2] Add integration tests verifying role/user filtering for `GET /api/analytics/demos-by-size` (Admin vs Basic) in `backend/Tests/Integration/Analytics/DemosBySizeAnalyticsTests.cs`

## Phase 5 – [US3] Analytics API Consumption & KPI Cards in Frontend

- [ ] T024 [P] [US3] Add `AnalyticsAccountsSummary` and `DemosBySizeSummary` TypeScript types to `frontend/src/lib/api.ts`
- [ ] T025 [P] [US3] Implement `getAnalyticsAccounts({ from, to, userId })` helper that calls `/api/analytics/accounts` and parses `data` in `frontend/src/lib/api.ts`
- [ ] T026 [P] [US3] Implement `getDemosBySize({ from, to, userId })` helper that calls `/api/analytics/demos-by-size` and parses `data` in `frontend/src/lib/api.ts`
- [ ] T027 [US3] Create new protected route file `frontend/src/app/(protected)/analytics/page.tsx` with TailAdmin page shell
- [ ] T028 [US3] Implement KPI cards layout (Created / Modified / Booked / Lost) using TailAdmin card styles in `frontend/src/app/(protected)/analytics/page.tsx`
- [ ] T029 [US3] Wire KPI cards to `getAnalyticsAccounts` and show loading and error states in `frontend/src/app/(protected)/analytics/page.tsx`

## Phase 6 – [US4] Filters & Demos by Size UI

- [ ] T030 [US4] Implement global date range controls (From / To date inputs) and local state in `frontend/src/app/(protected)/analytics/page.tsx`
- [ ] T031 [US4] Implement user selector dropdown (Admin: All + per-user; Basic: hidden or fixed to current user) in `frontend/src/app/(protected)/analytics/page.tsx`
- [ ] T032 [US4] Trigger re-fetch of `getAnalyticsAccounts` and `getDemosBySize` when date range or user filter changes in `frontend/src/app/(protected)/analytics/page.tsx`
- [ ] T033 [US4] Implement "Demos by Account Size" card with rows for Little/Small/Medium/Enterprise in `frontend/src/app/(protected)/analytics/page.tsx`
- [ ] T034 [US4] Wire Demos-by-Size rows to `getDemosBySize` results and show 0 values when no data in `frontend/src/app/(protected)/analytics/page.tsx`
- [ ] T035 [US4] Add simple empty-state helper text when all analytics values are 0 in `frontend/src/app/(protected)/analytics/page.tsx`

## Phase 7 – Polish & Cross-Cutting Concerns

- [ ] T036 Ensure `/analytics` respects the same auth guard and layout as `/dashboard` in `frontend/src/app/(protected)/analytics/page.tsx`
- [ ] T037 Verify analytics numbers match expectations for a few seeded test scenarios (manually) across roles and date ranges (no specific file; QA checklist)
- [ ] T038 Review TailAdmin styling (spacing, typography, responsiveness) for `/analytics` and adjust classes in `frontend/src/app/(protected)/analytics/page.tsx`
- [ ] T039 Run full backend and frontend test suites and fix any regressions across `backend/` and `frontend/`
- [ ] T040 Update any relevant README or quickstart notes about the new `/analytics` page in `specs/019-analytics-dashboard/quickstart.md`

## Dependencies & Execution Order

- Phase 1 and Phase 2 must be completed before backend integration tests (T014–T015, T022–T023).
- Backend analytics endpoints (T007–T023) should be implemented before frontend wiring (T024–T035).
- UI polish and cross-cutting tasks (T036–T040) come last.

## Parallelization Opportunities

- Tasks marked with `[P]` (T024–T026) can be implemented in parallel once backend contract shapes are stable.
- Backend integration tests for accounts and demos analytics (T014–T015, T022–T023) can be worked on in parallel after core queries are implemented.
