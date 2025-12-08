# Tasks: Dashboard User Filter

**Input**: Design documents from `/specs/022-dashboard-user-filter/`
**Prerequisites**: plan.md, spec.md, data-model.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Backend API Support

**Purpose**: Update backend endpoints to accept and process multi-user filtering

- [X] T001 [P] [US1] Add `userIds` parameter to `GetDashboardSummary` endpoint in `backend/Controllers/AccountsController.cs`
- [X] T002 [P] [US1] Implement parsing of comma-separated GUIDs in `backend/Controllers/AccountsController.cs`
- [X] T003 [US1] Add role-based filtering logic to `GetDashboardSummary` in `backend/Controllers/AccountsController.cs`
- [X] T004 [US1] Update account query to filter by user IDs in `backend/Controllers/AccountsController.cs`
- [X] T005 [US1] Update demo query to filter by user IDs in `backend/Controllers/AccountsController.cs`
- [X] T006 [P] [US1] Add `userIds` parameter to `GetAccountAnalytics` endpoint in `backend/Controllers/AnalyticsController.cs`
- [X] T007 [P] [US1] Add `userIds` parameter to `GetDemosBySize` endpoint in `backend/Controllers/AnalyticsController.cs`
- [X] T008 [US1] Implement parsing of comma-separated GUIDs in `backend/Controllers/AnalyticsController.cs`
- [X] T009 [US1] Add role-based filtering logic to analytics endpoints in `backend/Controllers/AnalyticsController.cs`
- [X] T010 [US1] Update account analytics query to filter by user IDs in `backend/Controllers/AnalyticsController.cs`
- [X] T011 [US1] Update demo analytics query to filter by user IDs in `backend/Controllers/AnalyticsController.cs`

**Checkpoint**: Backend endpoints now support multi-user filtering with role-based access control

---

## Phase 2: Frontend API Integration

**Purpose**: Update frontend API helpers to support multi-user filtering

- [X] T012 [P] [US1] Update `getDashboardSummary()` to accept optional userIds parameter in `frontend/src/lib/api.ts`
- [X] T013 [P] [US1] Update `getAnalyticsAccounts()` to accept optional userIds parameter in `frontend/src/lib/api.ts`
- [X] T014 [P] [US1] Update `getDemosBySize()` to accept optional userIds parameter in `frontend/src/lib/api.ts`
- [X] T015 [US1] Ensure backward compatibility with existing code in `frontend/src/lib/api.ts`
- [X] T016 [P] [US1] Update logout function to clear "dashboard_user_filter" from sessionStorage in `frontend/src/lib/auth/tokenService.ts`
- [X] T017 [US1] Update broadcast channel handler to clear filter on cross-tab logout in `frontend/src/lib/auth/tokenService.ts`

**Checkpoint**: Frontend API helpers now support multi-user filtering and proper logout behavior

---

## Phase 3: User Story 1 - Admin User Filter UI (Priority: P1) 🎯 MVP

**Goal**: Implement the multi-user filter UI for Admin users on the Dashboard page

**Independent Test**: Admin users can filter dashboard metrics by team members, and the filter persists across page reloads

### Implementation for User Story 1

- [X] T018 [US1] Add state for team users, selected user IDs, filter open state, loading state, and error state in `frontend/src/app/(protected)/dashboard/page.tsx`
- [X] T019 [US1] Add effect to load team users on component mount in `frontend/src/app/(protected)/dashboard/page.tsx`
- [X] T020 [US1] Add logic to restore filter selection from sessionStorage in `frontend/src/app/(protected)/dashboard/page.tsx`
- [X] T021 [US1] Add effect to update dashboard metrics based on filter selection in `frontend/src/app/(protected)/dashboard/page.tsx`
- [X] T022 [P] [US1] Add UI components for the filter card in `frontend/src/app/(protected)/dashboard/page.tsx`
- [X] T023 [US1] Add UI components for the dropdown trigger with selected user pills in `frontend/src/app/(protected)/dashboard/page.tsx`
- [X] T024 [US1] Add UI components for the dropdown menu with Select All / Clear All buttons in `frontend/src/app/(protected)/dashboard/page.tsx`
- [X] T025 [US1] Add UI components for the scrollable list of checkboxes in `frontend/src/app/(protected)/dashboard/page.tsx`
- [X] T026 [US1] Add handlers for user selection, Select All, and Clear All in `frontend/src/app/(protected)/dashboard/page.tsx`
- [X] T027 [US1] Add persistence logic for filter selection in `frontend/src/app/(protected)/dashboard/page.tsx`
- [X] T028 [US1] Add logic to handle inactive/deactivated users in `frontend/src/app/(protected)/dashboard/page.tsx`
- [X] T029 [US1] Add logic to handle sessionStorage unavailability in `frontend/src/app/(protected)/dashboard/page.tsx`
- [X] T030 [US1] Add role-based conditional rendering (Admin vs Basic) in `frontend/src/app/(protected)/dashboard/page.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Basic User Experience (Priority: P1)

**Goal**: Ensure Basic users always see only their own data without the filter UI

**Independent Test**: Basic users do not see the filter UI and always see only their own data

### Implementation for User Story 2

- [X] T031 [US2] Add role check to hide filter UI for Basic users in `frontend/src/app/(protected)/dashboard/page.tsx`
- [X] T032 [US2] Ensure Basic users' API calls always include their own user ID in `frontend/src/app/(protected)/dashboard/page.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Filter Persistence (Priority: P1)

**Goal**: Ensure filter selection persists across page reloads and resets on logout

**Independent Test**: Filter selection persists across page refreshes and resets on logout

### Implementation for User Story 3

- [X] T033 [US3] Add logic to store filter selection in sessionStorage in `frontend/src/app/(protected)/dashboard/page.tsx`
- [X] T034 [US3] Add logic to restore filter selection from sessionStorage on page load in `frontend/src/app/(protected)/dashboard/page.tsx`
- [X] T035 [US3] Add logic to reset filter to "ALL" on new login in `frontend/src/app/(protected)/dashboard/page.tsx`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Testing

**Purpose**: Verify the functionality of the Dashboard User Filter feature

- [ ] T036 [P] Create unit tests for parsing userIds parameter in backend controllers
- [ ] T037 [P] Create unit tests for role-based filtering logic in backend controllers
- [ ] T038 [P] Create unit tests for frontend API helpers in `frontend/src/lib/api.ts`
- [ ] T039 [P] Create unit tests for filter UI components in `frontend/src/app/(protected)/dashboard/page.tsx`
- [ ] T040 [P] Create unit tests for sessionStorage persistence in `frontend/src/app/(protected)/dashboard/page.tsx`
- [ ] T041 Create integration tests for filter UI with real API calls
- [ ] T042 Create end-to-end tests for Admin user filtering dashboard metrics
- [ ] T043 Create end-to-end tests for Basic user experience
- [ ] T044 Create end-to-end tests for cross-tab logout behavior

---

## Phase 7: Documentation & Deployment

**Purpose**: Document and deploy the Dashboard User Filter feature

- [ ] T045 [P] Update API documentation with new parameters
- [ ] T046 [P] Document sessionStorage usage
- [ ] T047 [P] Document filter behavior for Admin and Basic users
- [ ] T048 Deploy backend changes
- [ ] T049 Deploy frontend changes
- [ ] T050 Monitor for any issues

---

## Dependencies & Execution Order

### Phase Dependencies

- **Backend API Support (Phase 1)**: No dependencies - can start immediately
- **Frontend API Integration (Phase 2)**: Depends on Backend API Support completion
- **Admin User Filter UI (Phase 3)**: Depends on Frontend API Integration completion
- **Basic User Experience (Phase 4)**: Can run in parallel with Admin User Filter UI
- **Filter Persistence (Phase 5)**: Depends on Admin User Filter UI completion
- **Testing (Phase 6)**: Depends on all user stories being complete
- **Documentation & Deployment (Phase 7)**: Depends on Testing completion

### User Story Dependencies

- **User Story 1 (Admin User Filter UI)**: Depends on Backend API Support and Frontend API Integration
- **User Story 2 (Basic User Experience)**: Can start after Frontend API Integration
- **User Story 3 (Filter Persistence)**: Depends on User Story 1 completion

### Parallel Opportunities

- Backend endpoint updates for different controllers can run in parallel
- Frontend API helper updates can run in parallel
- UI component implementation can partially run in parallel
- Testing tasks can run in parallel
- Documentation tasks can run in parallel

---

## Parallel Example: Backend API Support

```bash
# Launch these tasks in parallel:
Task: "Add `userIds` parameter to `GetDashboardSummary` endpoint in `backend/Controllers/AccountsController.cs`"
Task: "Add `userIds` parameter to `GetAccountAnalytics` endpoint in `backend/Controllers/AnalyticsController.cs`"
Task: "Add `userIds` parameter to `GetDemosBySize` endpoint in `backend/Controllers/AnalyticsController.cs`"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1: Backend API Support
2. Complete Phase 2: Frontend API Integration
3. Complete Phase 3: Admin User Filter UI (User Story 1)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Backend API Support + Frontend API Integration → Foundation ready
2. Add Admin User Filter UI → Test independently → Deploy/Demo (MVP!)
3. Add Basic User Experience → Test independently → Deploy/Demo
4. Add Filter Persistence → Test independently → Deploy/Demo
5. Complete Testing and Documentation → Final Release

---

## Notes

- [P] tasks can be worked on in parallel by different developers
- Each user story should be independently testable
- Commit after each task or logical group
- Stop at any checkpoint to validate functionality

