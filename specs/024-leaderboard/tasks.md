# Tasks: 024-leaderboard – Leaderboard Feature

## Phase 1 – Setup & Environment

- [ ] T001 Ensure backend solution builds successfully in `backend/` and all existing tests pass
- [ ] T002 Ensure frontend Next.js app runs successfully from `frontend/` and existing pages load
- [ ] T003 Create a short README note in `specs/024-leaderboard/quickstart.md` describing how to run backend and frontend for this feature

## Phase 2 – Backend Foundations (Data & Utilities)

- [ ] T004 Verify `Account`, `AccountSize`, `Demo`, and `User` entities in `backend/Models` contain required fields for leaderboard scoring; update comments only if needed
- [ ] T005 Add a new method or static helper for weekly/monthly/quarterly date-range calculation in `backend/Services` or a new `DateRangeHelper` class
- [ ] T006 Add any missing DbContext navigation or indexes needed for efficient joins between `Accounts` and `Demos` in `backend/AppDbContext.cs`

## Phase 3 – Backend API: GET /leaderboard (US1 – View Leaderboard Data)

- [ ] T007 [US1] Add a new `LeaderboardController` in `backend/Controllers/LeaderboardController.cs` with base route `api/leaderboard` and `[Authorize]` attribute
- [ ] T008 [US1] Define DTOs in `backend/Controllers/LeaderboardController.cs` (or a DTO file) for leaderboard user row, demos breakdown, and response envelope matching `spec.md`
- [ ] T009 [US1] Implement query parameter validation for `period` (`weekly|monthly|quarterly`) in `GET /api/leaderboard` and return `400` for invalid values
- [ ] T010 [US1] In `GET /api/leaderboard`, compute `startDate` and `endDate` for the selected period using the shared date-range helper
- [ ] T011 [US1] Query active users (`IsActive = true`) from `AppDbContext.Users` and materialize minimal projection (Id, FullName, IsActive)
- [ ] T012 [US1] Query non-deleted accounts created within the date range from `AppDbContext.Accounts` and group by `CreatedByUserId` to compute `accountsCreated`
- [ ] T013 [US1] Query non-deleted demos with `Status = Completed` and `DoneAt` in range from `AppDbContext.Demos`, joining to `Accounts` and `AccountSize` to determine size; group by `(DemoAlignedByUserId, Size)` into small/medium/enterprise counts
- [ ] T014 [US1] Implement scoring logic in C# to compute total points per user according to `spec.md` (accounts and demos with size-based weights; treat missing size as Small)
- [ ] T015 [US1] Filter out users with `points == 0` and any inactive users before building the response list
- [ ] T016 [US1] Sort users by points desc, total demo count desc, and name asc before returning the JSON response
- [ ] T017 [US1] Add integration tests in `backend/Tests/Integration` validating scoring, filtering, and sorting for several synthetic combinations of accounts/demos

## Phase 4 – Frontend Leaderboard Page (US2 – View Leaderboard UI)

- [ ] T018 [US2] Create new protected route file `frontend/src/app/(protected)/leaderboard/page.tsx` wired into existing auth/layout
- [ ] T019 [US2] Implement period state (`weekly|monthly|quarterly`), loading, error, and data state in the leaderboard page component
- [ ] T020 [US2] Implement tabs for Weekly, Monthly, Quarterly in the leaderboard page header that update period state and trigger a refetch
- [ ] T021 [US2] Implement a data-fetching helper in `frontend/src/lib/api.ts` (or similar) for `getLeaderboard(period)` calling `/api/leaderboard?period=...`
- [ ] T022 [US2] Show a skeleton or loading state on the leaderboard page while data is being fetched
- [ ] T023 [US2] Render the date-range and period label at the top of the page using `startDate`, `endDate`, and `period` from the API response
- [ ] T024 [US2] Render a scrollable ranked list of users with rank, name, accounts count, demos total (and optional breakdown), and points aligned to the right
- [ ] T025 [US2] Add visual highlighting for the top three users in the list (e.g., gold/silver/bronze badges) based on list index
- [ ] T026 [US2] Add a scoring system information box at the bottom of the page explaining the points for accounts and each demo size, matching `spec.md`
- [ ] T027 [US2] Handle error state on the leaderboard page with a friendly message and a simple retry action
- [ ] T028 [US2] Handle empty `users` array by rendering a clear “No leaderboard data for this period yet” message

## Phase 5 – Frontend–Backend Integration & Polish

- [ ] T029 Smoke-test the full flow manually in the browser: confirm switching tabs issues correct API calls and UI matches sample scoring
- [ ] T030 Add at least one frontend test (unit or integration) under `frontend/tests` to confirm sorting and basic rendering of leaderboard items from a mocked API response
- [ ] T031 Review and update any navigation/sidebar component (e.g., in `frontend/src/components/layout/AppShellHeader.tsx` or layout) to ensure the "Leaderboard" menu item routes to `/leaderboard`
- [ ] T032 Run full backend and frontend test suites and fix any regressions prior to opening PR

## Dependencies & Ordering

- Phase 1 and Phase 2 should be completed before Phase 3.
- Phase 3 (backend API) should be completed before final integration tasks in Phase 5, but Phase 4 (frontend UI) can be developed in parallel using mocked data.
- Tasks marked with the same phase number can often be parallelized across different files.
