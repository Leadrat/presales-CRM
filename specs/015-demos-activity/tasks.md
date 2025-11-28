# Tasks: Spec 015 – Demo Entity & Demo Activity History

## Phase 1 – Setup

- [ ] T001 Ensure `015-demos-activity` branch is checked out in the repo root
- [ ] T002 Verify backend solution builds successfully before Demo changes (`backend/`)
- [ ] T003 Verify frontend app builds and runs successfully before Demo changes (`frontend/`)

## Phase 2 – Foundational Backend & Data

- [ ] T004 Add `Demo` entity class matching data-model.md to backend Models/Demo.cs
- [ ] T005 Wire `DbSet<Demo>` and relationships into the DbContext in backend (e.g., `backend/Models/AppDbContext.cs`)
- [ ] T006 Create EF Core migration to add `Demos` table with all columns and FKs in backend/Migrations/AddDemoEntity.cs
- [ ] T007 Apply migrations to local database and verify `Demos` table exists (`dotnet ef database update` from backend/)

## Phase 3 – User Story 1 (US1) – View demo history for an account

Goal: Admin and Basic users can see all demos for an account in a Demos tab, filtered for soft-deleted demos.

- [ ] T008 [US1] Implement `GET /api/Accounts/{accountId}/demos` endpoint in backend (AccountsController or new DemosController in `backend/Controllers`)
- [ ] T009 [P] [US1] Add repository/service method to load non-deleted demos by AccountId in backend services layer (e.g., `backend/Services/DemoService.cs`)
- [ ] T010 [US1] Map `Demo` entities to DTO used by API responses, including aligned/done user display names (`backend/Models/Interfaces/DemoDto.cs` or similar)
- [ ] T011 [US1] Expose `getAccountDemos(accountId)` helper in frontend/src/lib/api.ts using the new GET endpoint
- [ ] T012 [US1] Add a **Demos** tab shell to Admin Account detail page in frontend/src/app/(admin)/accounts/[id]/page.tsx
- [ ] T013 [US1] Render demos table in Admin Demos tab showing Scheduled at, Done at, Aligned by, Done by, Attendees/POCs, Notes in frontend/src/app/(admin)/accounts/[id]/page.tsx
- [ ] T014 [US1] Add a **Demos** tab shell to Basic My Account detail page in frontend/src/app/(protected)/my-accounts/[id]/page.tsx
- [ ] T015 [US1] Render demos table in Basic Demos tab reusing the same columns and styling in frontend/src/app/(protected)/my-accounts/[id]/page.tsx
- [ ] T016 [US1] Ensure soft-deleted demos are excluded from all list queries and UI views (filter `IsDeleted = false` in backend and verify via UI)

## Phase 4 – User Story 2 (US2) – Create a demo for an account

Goal: Admins and eligible Basic users can create demos from the Demos tab via a modal and see them appear without full page reload.

- [ ] T017 [US2] Implement `POST /api/Accounts/{accountId}/demos` endpoint in backend/Controllers (with RBAC checks for Admin or Basic creator)
- [ ] T018 [P] [US2] Add server-side validation for required fields (`AccountId`, `ScheduledAt`, `DemoAlignedByUserId`) and model binding for optional fields in backend
- [ ] T019 [US2] Implement `createAccountDemo(accountId, input)` helper in frontend/src/lib/api.ts
- [ ] T020 [US2] Add **+ Add Demo** button in Admin Demos tab and wire it to open an Add Demo modal in frontend/src/app/(admin)/accounts/[id]/page.tsx
- [ ] T021 [US2] Implement Add Demo modal UI in Admin flow (fields: scheduledAt, attendees/POCs, alignedBy defaulting to current user, optional doneBy/doneAt, notes) with TailAdmin styling in frontend/src/app/(admin)/accounts/[id]/page.tsx or components/demos/AddDemoModal.tsx
- [ ] T022 [US2] After successful create, close the Admin modal and refetch `getAccountDemos` to refresh the table without full reload
- [ ] T023 [US2] Add **+ Add Demo** button and modal behavior to Basic Demos tab only for accounts created by the current user in frontend/src/app/(protected)/my-accounts/[id]/page.tsx
- [ ] T024 [US2] Ensure Basic users who did not create the account can see the Demos list but not the **+ Add Demo** button in Basic flow

## Phase 5 – User Story 3 (US3) – Track demo completion and responsibilities (edit demos)

Goal: Users can update demos to mark them completed and correct details, with aligned/done users clearly shown.

- [ ] T025 [US3] Implement `PUT /api/Accounts/{accountId}/demos/{demoId}` endpoint to update core Demo fields in backend/Controllers
- [ ] T026 [P] [US3] Update Demo service/repository layer to apply allowed field updates and maintain `UpdatedAt` in backend/Services/DemoService.cs
- [ ] T027 [US3] Implement `updateAccountDemo(accountId, demoId, input)` helper in frontend/src/lib/api.ts
- [ ] T028 [US3] Add UI affordance in Admin Demos tab to edit an existing demo (e.g., row action or inline edit) and wire it to call the update API from frontend/src/app/(admin)/accounts/[id]/page.tsx
- [ ] T029 [US3] Ensure Admin UI allows setting/updating `DoneAt` and `DemoDoneByUserId` and editing attendees/notes while preserving styling
- [ ] T030 [US3] Add corresponding edit behavior in Basic Demos tab, respecting RBAC (Basic users can only edit demos on accounts they created) in frontend/src/app/(protected)/my-accounts/[id]/page.tsx
- [ ] T031 [US3] After a successful update, refresh the demos list in both Admin and Basic flows without full page reload

## Phase 6 – Soft Delete & Consistency

- [ ] T032 Implement soft-delete behavior for demos via `DELETE /api/Accounts/{accountId}/demos/{demoId}` in backend/Controllers
- [ ] T033 Ensure `IsDeleted` and timestamps are updated correctly on soft-delete and that all list endpoints filter them out
- [ ] T034 Verify that account soft-delete hides associated demos from all standard flows

## Phase 7 – Polish & Cross-Cutting

- [ ] T035 Add any missing null/empty-state handling for the Demos tab (no demos yet) in both Admin and Basic pages
- [ ] T036 Confirm dark/light mode styling for Demos tab, table, and modal matches Spec 013 patterns in the existing UI
- [ ] T037 Add basic logging for demo create/update/delete actions in the backend consistent with ActivityLog patterns (if available in backend/)
- [ ] T038 Smoke test Admin and Basic flows end-to-end using quickstart.md scenarios and adjust any minor UX issues found
