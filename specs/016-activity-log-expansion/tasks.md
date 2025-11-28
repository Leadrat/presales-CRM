---

description: "Task list for Activity Log Expansion v2"
---

# Tasks: Activity Log Expansion v2

**Input**: Design documents from `/specs/016-activity-log-expansion/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: This feature should include backend and frontend tests because auditability is critical, but test tasks are still listed explicitly and can be scoped as needed.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm existing backend/frontend infrastructure is ready for Activity Log work.

- [ ] T001 [P] Verify backend migrations and DbContext configuration are working by running existing migrations in `backend/`
- [ ] T002 [P] Verify frontend build and test commands run successfully for account pages in `frontend/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core Activity Log infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Define `ActivityType` and `ActivityLog` EF Core entities in `backend/Models/ActivityType.cs` and `backend/Models/ActivityLog.cs`
- [X] T004 Add `DbSet<ActivityType>` and `DbSet<ActivityLog>` to the main DbContext in `backend/Models/ApplicationDbContext.cs`
- [X] T005 Create EF Core migration to create `ActivityTypes` and `ActivityLogs` tables with required columns and indexes in `backend/Migrations/`
- [X] T006 [P] Seed initial `ActivityTypes` values (e.g., `ACCOUNT_CREATED`, `DEAL_STAGE_CHANGED`, `CONTACT_ADDED`, `DEMO_SCHEDULED`, `NOTE_ADDED`) in the appropriate migration or seeding configuration in `backend/Migrations/`
- [X] T007 [P] Create `ActivityLogService` (interface and implementation skeleton) for writing/reading logs in `backend/Services/ActivityLogService.cs`
- [X] T008 [P] Create backend test fixture for Activity Log integration tests in `backend/Tests/Integration/ActivityLogTestFixture.cs`

**Checkpoint**: Activity tables, entities, DbContext, and base service/test scaffolding are ready.

---

## Phase 3: User Story 1 - View full account history (Priority: P1) MVP
## Phase 3: User Story 1 - View full account history (Priority: P1) 🎯 MVP

**Goal**: Show a clear, time-ordered Activity Log for a single account, including key events (account created/updated, demo scheduled) with timestamps and actor.

**Independent Test**: For a sample account, performing a sequence of actions (create account, update account, schedule demo) results in visible Activity entries in the Activity tab, ordered by time.

### Tests for User Story 1

- [X] T009 [P] [US1] Add backend integration test that `GET /api/accounts/{accountId}/activity` returns entries ordered by `CreatedAt` in `backend/Tests/Integration/ActivityLogActivityEndpointTests.cs`
- [X] T010 [P] [US1] Add frontend component test to ensure `ActivityLogList` renders entries and empty state in `frontend/tests/components/ActivityLogList.test.tsx`

### Implementation for User Story 1

- [X] T011 [P] [US1] Implement `ActivityLogEntryDto` and mapping from `ActivityLog` entity in `backend/Models/ActivityLogEntryDto.cs`
- [X] T012 [US1] Implement read method on `ActivityLogService` to fetch Activity Logs per account ordered by `CreatedAt DESC` in `backend/Services/ActivityLogService.cs`
- [X] T013 [US1] Expose `GET /api/accounts/{accountId}/activity` endpoint using `ActivityLogService` in `backend/Controllers/AccountsController.cs`
- [X] T014 [P] [US1] Implement `getAccountActivity(accountId, filters)` API helper that calls `/api/accounts/{accountId}/activity` in `frontend/src/lib/api.ts`
- [X] T015 [P] [US1] Create `ActivityLogList` React component to render Activity entries in `frontend/src/components/activity/ActivityLogList.tsx`
- [X] T016 [US1] Add an **Activity** tab/section to the account detail page and wire it to `getAccountActivity` in `frontend/src/app/(protected)/my-accounts/[id]/page.tsx`
- [X] T017 [US1] Implement loading, empty, and basic error states for the Activity tab in `frontend/src/app/(protected)/my-accounts/[id]/page.tsx`

**Checkpoint**: User Story 1 is fully functional and independently testable (basic Activity timeline per account).

---

## Phase 4: User Story 2 - Audit who changed what and when (Priority: P1)

**Goal**: Ensure critical account field changes (deal stage, lead source, decision makers, etc.) are logged with old/new values and actor so managers can audit changes.

**Independent Test**: Updating key account fields results in Activity entries that show old and new values plus who made the change and when.

### Tests for User Story 2

- [X] T018 [P] [US2] Add backend integration tests verifying deal stage changes emit `DEAL_STAGE_CHANGED` entries with old/new values in `backend/Tests/Integration/AccountActivityLogTests.cs`
- [X] T019 [P] [US2] Add backend integration tests verifying lead source changes emit `LEAD_SOURCE_CHANGED` entries with old/new values in `backend/Tests/Integration/AccountActivityLogTests.cs`

### Implementation for User Story 2

- [X] T020 [P] [US2] Extend `ActivityLogService` with helpers to format old/new value messages for key account fields in `backend/Services/ActivityLogService.cs`
- [X] T021 [US2] Wire `ActivityLogService` into account update flow to log key field changes in `backend/Controllers/AccountsController.cs`
- [X] T022 [US2] Ensure account update logs correctly capture `ActorUserId` and display name from the current user context in `backend/Controllers/AccountsController.cs`
- [X] T023 [P] [US2] Ensure `ActivityLogList` shows clear field change descriptions (e.g., "Deal stage changed from 'New lead' to 'Qualified'") in `frontend/src/components/activity/ActivityLogList.tsx`

**Checkpoint**: User Stories 1 and 2 together provide a usable, auditable change history for key account fields.

---

## Phase 5: User Story 3 - Track contact and demo lifecycle (Priority: P2)

**Goal**: Log contact add/edit/delete and demo scheduled/updated/completed/cancelled events so engagement history is visible per account.

**Independent Test**: Creating, editing, deleting contacts and scheduling/completing/cancelling demos for an account result in clear Activity entries with the right related entity and actor.

### Tests for User Story 3

- [X] T024 [P] [US3] Add backend integration tests verifying contact add/update/delete actions create appropriate ActivityLogs rows in `backend/Tests/Integration/ContactActivityLogTests.cs`
- [X] T025 [P] [US3] Add backend integration tests verifying demo scheduled/completed/cancelled actions create appropriate ActivityLogs rows in `backend/Tests/Integration/DemoActivityLogTests.cs`

### Implementation for User Story 3

- [X] T026 [P] [US3] Extend `ActivityLogService` with methods for `LogContactAdded`, `LogContactUpdated`, `LogContactDeleted`, `LogDemoScheduled`, `LogDemoUpdated`, `LogDemoCompleted`, `LogDemoCancelled` in `backend/Services/ActivityLogService.cs`
- [X] T027 [US3] Wire contact create/update/delete flows to call `ActivityLogService` in `backend/Controllers/AccountsController.cs` (or relevant contacts endpoints)
- [X] T028 [US3] Wire demo scheduling/update/completion/cancellation flows to call `ActivityLogService` in `backend/Controllers/AccountsController.cs` (or relevant demo endpoints)
- [X] T029 [P] [US3] Update `ActivityLogList` to show contact and demo-specific labels and related entity context (e.g., contact name, demo time) in `frontend/src/components/activity/ActivityLogList.tsx`

**Checkpoint**: Contact and demo lifecycle events are visible in the Activity Log, extending the account story.

---

## Phase 6: User Story 4 - Filter and scan relevant activity (Priority: P3)

**Goal**: Allow users to focus on relevant activity via filters (event type, date range, user) and support pagination/load-more for long histories.

**Independent Test**: Applying different filter combinations and pagination settings on an account’s Activity tab returns the correct subset of entries, preserving order.

### Tests for User Story 4

- [X] T030 [P] [US4] Add backend tests for event type and date range filters on `GET /api/accounts/{accountId}/activity` in `backend/Tests/Integration/ActivityLogFiltersTests.cs`
- [X] T031 [P] [US4] Add backend tests for user/actor filter and pagination/cursor behavior in `backend/Tests/Integration/ActivityLogFiltersTests.cs`
- [X] T032 [P] [US4] Add frontend integration test to verify UI filters narrow the activity list correctly in `frontend/tests/integration/AccountActivityTab.test.tsx`

### Implementation for User Story 4

- [X] T033 [P] [US4] Extend `ActivityLogService` query to accept event type, date range, and user filters plus cursor/limit in `backend/Services/ActivityLogService.cs`
- [X] T034 [US4] Update `GET /api/accounts/{accountId}/activity` endpoint to parse query parameters and pass filters to the service in `backend/Controllers/AccountsController.cs`
- [X] T035 [P] [US4] Implement event type, date range, and user filter controls in the Activity tab UI in `frontend/src/app/(protected)/my-accounts/[id]/page.tsx`
- [X] T036 [P] [US4] Wire filters and load-more/pagination to `getAccountActivity` and handle `nextCursor` in `frontend/src/app/(protected)/my-accounts/[id]/page.tsx`

**Checkpoint**: All four user stories are independently functional; users can slice and scan activity efficiently.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and overall robustness.

- [ ] T037 [P] Add documentation of Activity Log behavior, edge cases, and limitations to `specs/016-activity-log-expansion/quickstart.md` and any relevant user-facing docs
- [ ] T038 [P] Verify and, if needed, optimize database indexes and query plans for `ActivityLogs` queries in `backend/`
- [ ] T039 [P] Ensure structured logging includes correlation IDs and key metadata when writing ActivityLogs in `backend/`
- [ ] T040 Run an end-to-end manual validation of Activity Log scenarios using `quickstart.md` and capture any follow-up tasks in `specs/016-activity-log-expansion/tasks.md`

- [ ] T041 Ensure Activity Log filters in the account Activity tab are implemented as lightweight, inline controls (e.g., chips or small dropdowns directly above the list) rather than a large header toolbar like "All events / All time / Me", and confirm the UI matches the ABM-style sample layout in `frontend/src/app/(protected)/my-accounts/[id]/page.tsx`

- [ ] T042 Wire account, contact, and demo actions so that, after a successful save/schedule/update/complete/cancel operation, the Activity Log for that account automatically refreshes (via refetch or optimistic insert) **without** a full page reload or manual "Refresh" button, and remove any standalone Refresh control from the Activity tab UI in `frontend/src/app/(protected)/my-accounts/[id]/page.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3–6)**: All depend on Foundational phase completion.
  - User Story 1 (P1) should be implemented first as the MVP timeline.
  - User Stories 2–4 can then proceed in priority order (P1 → P2 → P3) or in parallel if team capacity allows.
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - no dependencies on other stories.
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - builds on the Activity timeline from US1 but is independently testable.
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - depends on Activity infrastructure from US1 but is independently testable.
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - depends on a working timeline from US1 but is independently testable.

### Within Each User Story

- Tests (if included) SHOULD be written and validated alongside implementation.
- Models/entities before services.
- Services before endpoints.
- Core implementation before UI integration.
- Story complete and testable before moving to the next priority.

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel.
- All Foundational tasks marked [P] can run in parallel within Phase 2.
- Once Foundational is complete, user story tasks marked [P] that touch different files can proceed in parallel.
- Backend and frontend tasks for the same user story can often be done in parallel, coordinating on the OpenAPI contract.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories).
3. Complete Phase 3: User Story 1.
4. **STOP and VALIDATE**: Test User Story 1 independently (backend + frontend).
5. Deploy/demo if ready.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready.
2. Add User Story 1 → Test independently → Deploy/Demo (MVP).
3. Add User Story 2 → Test independently → Deploy/Demo.
4. Add User Story 3 → Test independently → Deploy/Demo.
5. Add User Story 4 → Test independently → Deploy/Demo.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together.
2. Once Foundational is done:
   - Developer A: Focus on User Story 1 (API + Activity tab read-only timeline).
   - Developer B: Focus on User Story 2 (field change logging & tests).
   - Developer C: Focus on User Story 3 (contact/demo lifecycle logging).
   - Developer D: Focus on User Story 4 (filters & pagination UX).
3. Stories complete and integrate independently.
