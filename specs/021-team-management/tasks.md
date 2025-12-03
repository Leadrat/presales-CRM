# Spec 021 – Team Management (Users & Roles UI) – Tasks

This file defines the implementation tasks for Spec 021, organized by phases and user stories. All tasks follow the required checklist format:

`- [ ] T00X [P] [USn] Description with file path`

---

## Phase 1 – Setup

- [ ] T001 Verify existing user model and context in `backend/Models/User.cs` and `backend/AppDbContext.cs`
- [ ] T002 Confirm current `UsersController` behavior in `backend/Controllers/UsersController.cs` and document limitations (active-only list, no paging)
- [ ] T003 Ensure auth context service is available for role checks in `backend/Services/ICurrentUserService.cs` and `backend/Services/CurrentUserService.cs`
- [ ] T004 [P] Create or update TypeScript user DTO types and auth types in `frontend/src/lib/api.ts` based on Spec 021 fields
- [ ] T005 [P] Create feature folder and ensure spec/plan/tasks for Spec 021 are wired into your workflow in `specs/021-team-management/`

---

## Phase 2 – Foundational Backend & Frontend Infrastructure

- [ ] T006 Implement shared user list DTO and paging response shape in `backend/Controllers/UsersController.cs`
- [ ] T007 Add basic paging helper (page, pageSize, totalCount) logic in `backend/Controllers/UsersController.cs`
- [ ] T008 [P] Ensure `User` entity supports `IsActive`, `IsDeleted`, and (if needed) `DeactivatedAt` / equivalent timestamp in `backend/Models/User.cs`
- [ ] T009 [P] Add or update EF model configuration for user fields (email length, phone length, role foreign key) in `backend/AppDbContext.cs`
- [ ] T010 [P] Add base `getUsers` API helper with paging and status parameters in `frontend/src/lib/api.ts`
- [ ] T011 [P] Add base `getUser`, `updateUser`, and `deleteUser` helpers in `frontend/src/lib/api.ts`
- [ ] T012 Define route segment folder for Team page under `frontend/src/app/(protected)/team/page.tsx`

---

## Phase 3 – US1: View all users in the organization

_User Story 1: As an Admin, I can open the Team page and see a grid of user cards with names, roles, and contact information._

- [ ] T013 [US1] Add `Team` navigation item in the sidebar, visible for all authenticated users, in `frontend/src/layout/AppSidebar.tsx`
- [ ] T014 [P] [US1] Implement protected Team route shell with header ("Team Management" + subtitle) in `frontend/src/app/(protected)/team/page.tsx`
- [ ] T015 [P] [US1] Implement `UserCard` component for avatar, full name, role badge, email, and phone layout in `frontend/src/components/team/UserCard.tsx`
- [ ] T016 [P] [US1] Implement `RoleBadge` component for Admin/Basic styling in `frontend/src/components/team/RoleBadge.tsx`
- [ ] T017 [US1] Wire Team page initial data fetch using `getUsers({ status: "all", page: 1, pageSize: 20 })` in `frontend/src/app/(protected)/team/page.tsx`
- [ ] T018 [US1] Render responsive grid of `UserCard` components using data from `getUsers` in `frontend/src/app/(protected)/team/page.tsx`
- [ ] T019 [P] [US1] Implement basic loading and error states for the Team list (spinner/message) in `frontend/src/app/(protected)/team/page.tsx`
- [ ] T020 [US1] Ensure non-admin users see the same read-only grid but without active actions in `frontend/src/app/(protected)/team/page.tsx`

---

## Phase 4 – US2: Filter by Active / Inactive users

_User Story 2: As an Admin, I can filter the Team view between All, Active, and Inactive users._

- [ ] T021 [US2] Extend `GET /api/users` to accept `status=all|active|inactive` and filter using `IsActive` and `IsDeleted` in `backend/Controllers/UsersController.cs`
- [ ] T022 [P] [US2] Update `getUsers` helper to include optional `status` parameter and map response shape in `frontend/src/lib/api.ts`
- [ ] T023 [US2] Implement `FilterTabs` component for All Users / Active Users / Inactive Users in `frontend/src/components/team/FilterTabs.tsx`
- [ ] T024 [US2] Wire filter tabs to Team page state and URL query param `status` in `frontend/src/app/(protected)/team/page.tsx`
- [ ] T025 [US2] Trigger refetch of user list when filter tab changes (status + page reset) in `frontend/src/app/(protected)/team/page.tsx`
- [ ] T026 [P] [US2] Ensure Inactive filter only shows users with `isActive == false` (no soft-deleted users) in `backend/Controllers/UsersController.cs`

---

## Phase 5 – US3: Edit a user’s details

_User Story 3: As an Admin, I can edit a user’s name, email, phone, and role._

- [ ] T027 [US3] Add `GET /api/users/{id}` endpoint to return full user details in `backend/Controllers/UsersController.cs`
- [ ] T028 [US3] Add `PATCH /api/users/{id}` endpoint to update full name, email, phone, and role with validation in `backend/Controllers/UsersController.cs`
- [ ] T029 [P] [US3] Implement role/authorization check so only Admins can patch users in `backend/Controllers/UsersController.cs`
- [ ] T030 [P] [US3] Add `getUser(id)` helper to fetch single-user data for editing in `frontend/src/lib/api.ts`
- [ ] T031 [P] [US3] Add `updateUser(id, payload)` helper to send PATCH requests in `frontend/src/lib/api.ts`
- [ ] T032 [US3] Implement `EditUserModal` (form fields + validation) in `frontend/src/components/team/EditUserModal.tsx`
- [ ] T033 [US3] Add three-dot `OptionsMenu` to `UserCard` with Edit option (admin-only) in `frontend/src/components/team/UserCard.tsx`
- [ ] T034 [US3] Wire Edit option to open `EditUserModal` and submit to `updateUser` with loading/disabled state in `frontend/src/app/(protected)/team/page.tsx`
- [ ] T035 [US3] Refresh the relevant `UserCard` data after a successful edit (refetch or local state update) in `frontend/src/app/(protected)/team/page.tsx`

---

## Phase 6 – US4: Change a user’s role

_User Story 4: As an Admin, I can promote/demote a user between Admin and Basic._

- [ ] T036 [US4] Ensure user model and DTO expose role information (e.g. role name or roleId mapping) in `backend/Models/User.cs` and `backend/Controllers/UsersController.cs`
- [ ] T037 [US4] Extend `PATCH /api/users/{id}` to validate and apply role changes (Admin/Basic) in `backend/Controllers/UsersController.cs`
- [ ] T038 [P] [US4] Update `updateUser` helper to accept role field and map it correctly in `frontend/src/lib/api.ts`
- [ ] T039 [US4] Add Make Admin / Remove Admin options to `OptionsMenu` (admin-only) in `frontend/src/components/team/UserCard.tsx`
- [ ] T040 [US4] Implement confirmation UX (simple confirm modal or inline) for role changes and call `updateUser` in `frontend/src/app/(protected)/team/page.tsx`
- [ ] T041 [US4] Refresh role badge and state after successful role update in `frontend/src/app/(protected)/team/page.tsx`

---

## Phase 7 – US5: Deactivate / Activate a user

_User Story 5: As an Admin, I can deactivate a user so they cannot sign in, and later reactivate them._

- [ ] T042 [US5] Extend `PATCH /api/users/{id}` to toggle `IsActive` and manage `DeactivatedAt` timestamp in `backend/Controllers/UsersController.cs`
- [ ] T043 [US5] Ensure auth/login logic honors `IsActive` (deactivated users cannot sign in) in the relevant backend auth controller or service file
- [ ] T044 [P] [US5] Update `updateUser` helper payload to include `isActive` in `frontend/src/lib/api.ts`
- [ ] T045 [US5] Add Deactivate / Activate options to `OptionsMenu` (admin-only) in `frontend/src/components/team/UserCard.tsx`
- [ ] T046 [US5] Implement confirmation modal text explaining deactivation impact, and call `updateUser` in `frontend/src/app/(protected)/team/page.tsx`
- [ ] T047 [US5] Show Inactive badge and deactivated date on `UserCard` when `isActive == false` in `frontend/src/components/team/UserCard.tsx`
- [ ] T048 [US5] Ensure filters All/Active/Inactive reflect updated `IsActive` after deactivation/activation in `frontend/src/app/(protected)/team/page.tsx`

---

## Phase 8 – US6: Delete a user (soft delete)

_User Story 6: As an Admin, I can soft-delete a user so they no longer appear on the Team page._

- [ ] T049 [US6] Implement `DELETE /api/users/{id}` endpoint that marks `IsDeleted = true` and sets `DeletedAt` in `backend/Controllers/UsersController.cs`
- [ ] T050 [P] [US6] Enforce Admin-only authorization on DELETE in `backend/Controllers/UsersController.cs`
- [ ] T051 [US6] Ensure all `GET /api/users` queries exclude `IsDeleted == true` in `backend/Controllers/UsersController.cs`
- [ ] T052 [P] [US6] Add `deleteUser(id)` helper to call DELETE endpoint in `frontend/src/lib/api.ts`
- [ ] T053 [US6] Add Delete option with confirmation modal to `OptionsMenu` (admin-only) in `frontend/src/components/team/UserCard.tsx`
- [ ] T054 [US6] After successful delete, remove the user from current page list or refetch in `frontend/src/app/(protected)/team/page.tsx`

---

## Phase 9 – Polish, Accessibility, and Cross-Cutting Concerns

- [ ] T055 Review keyboard navigation and focus management for tabs, cards, menus, and modals in `frontend/src/app/(protected)/team/page.tsx` and related components
- [ ] T056 [P] Add appropriate ARIA attributes for `FilterTabs`, `OptionsMenu`, and `EditUserModal` in `frontend/src/components/team/FilterTabs.tsx`, `UserCard.tsx`, and `EditUserModal.tsx`
- [ ] T057 [P] Implement empty-state messages for All/Active/Inactive filters when no users match in `frontend/src/app/(protected)/team/page.tsx`
- [ ] T058 [P] Add toast or inline success/error feedback for all user actions in `frontend/src/app/(protected)/team/page.tsx`
- [ ] T059 Verify pagination UX at various team sizes and adjust page size cap (while keeping default at 20) in `backend/Controllers/UsersController.cs` and `frontend/src/app/(protected)/team/page.tsx`
- [ ] T060 Final regression pass for Admin vs Basic behaviors on `/team` and API auth checks in backend controllers and `frontend/src/app/(protected)/team/page.tsx`

---

## Dependencies & Parallelization Overview

- Backend foundational work (T006–T011) should complete before most user-story frontend work, but some UI scaffolding (T013–T016, T014) can proceed in parallel.
- API helpers (T010–T011) can be implemented in parallel with backend list/patch/delete endpoints once contracts are defined.
- User-story phases US3–US6 can be tackled largely independently after list + filters are stable, with care around shared files like `UsersController.cs` and `api.ts`.

### Suggested MVP Scope

- MVP = Phases 1–4 and basic part of Phase 5:
  - View Team page with All/Active/Inactive filters, paging, and read-only cards.
  - Admin-only Edit action for basic profile fields.
- Advanced actions (role change, deactivate/activate, delete) can follow as incremental milestones.
