# Implementation Tasks: Spec 014 – Lead Source & Deal Stage Integration

**Feature**: Lead Source & Deal Stage Integration  
**Spec**: `specs/014-lead-source-deal-stage/spec.md`  
**Plan**: `specs/014-lead-source-deal-stage/plan.md`

---

## Phase 1 – Setup

- [ ] T001 Ensure backend solution builds and tests run (from `backend/`)
- [ ] T002 Ensure frontend dev server and linting work (from `frontend/`)

---

## Phase 2 – Foundational Data & Contracts

- [ ] T003 Define LeadSource and DealStage enums / lookup model types in `backend/src/Models` (no behavior yet)
- [ ] T004 Update Account entity in `backend/src/Models/Account.cs` to include `LeadSource` and `DealStage` properties
- [ ] T005 Update EF model configuration in `backend/src/AppDbContext.cs` (or equivalent) to map LeadSource/DealStage fields
- [ ] T006 Add LeadSource/DealStage fields to Account DTOs in `backend/src/Contracts/Accounts` (request/response models)
- [ ] T007 Update OpenAPI or contract docs for account create/update/detail endpoints in `specs/014-lead-source-deal-stage/contracts/` (if used)

---

## Phase 3 – User Story 1: Capture Lead Source on Account Create (Admin) [P1]

Goal: Admin can choose Lead Source when creating an account; value persists and shows on detail page.

### Backend

- [ ] T008 [US1] Add LeadSource column and defaults via EF migration in `backend/src/Data/Migrations` (including historical backfill with "Not Set" or equivalent)
- [ ] T009 [US1] Extend account create handler/service in `backend/src/Services/Accounts` to accept and validate LeadSource
- [ ] T010 [US1] Extend account detail GET logic in `backend/src/Controllers/AccountsController.cs` (or equivalent) to return LeadSource

### Frontend

- [ ] T011 [P] [US1] Extend account DTO types in `frontend/src/lib/api.ts` to include `leadSource` for create and detail responses
- [ ] T012 [P] [US1] Add Lead Source select options (enum key + label mapping) in `frontend/src/lib/api.ts` or a small helper module
- [ ] T013 [US1] Add TailAdmin-style Lead Source `<select>` to Admin Account Create form in `frontend/src/app/(admin)/accounts/new/page.tsx` within the **Company Information** section
- [ ] T014 [US1] Wire Lead Source field into Admin Account Create form state and submit payload in `frontend/src/app/(admin)/accounts/new/page.tsx`
- [ ] T015 [US1] Display read-only Lead Source value in Admin Account Detail Company Information section in `frontend/src/app/(admin)/accounts/[id]/page.tsx`

### Verification

- [ ] T016 [US1] Manually test creating accounts with each Lead Source option and verify persistence on Admin Account Detail page

---

## Phase 4 – User Story 2: Track Deal Stage Progression on Accounts (Admin) [P1]

Goal: Admin can set and update Deal Stage on accounts; value is visible and persists.

### Backend

- [ ] T017 [US2] Add DealStage column and defaults via EF migration in `backend/src/Data/Migrations` (including historical backfill to `NEW_LEAD` or chosen default)
- [ ] T018 [US2] Extend account create handler/service in `backend/src/Services/Accounts` to accept and validate DealStage
- [ ] T019 [US2] Extend account update logic in `backend/src/Services/Accounts` to allow DealStage changes
- [ ] T020 [US2] Ensure account detail GET in `backend/src/Controllers/AccountsController.cs` returns DealStage

### Frontend

- [ ] T021 [P] [US2] Extend account DTO types in `frontend/src/lib/api.ts` to include `dealStage` for create/update/detail
- [ ] T022 [P] [US2] Add Deal Stage select options (enum key + label mapping) in `frontend/src/lib/api.ts` or helper module
- [ ] T023 [US2] Add TailAdmin-style Deal Stage `<select>` to Admin Account Create form in `frontend/src/app/(admin)/accounts/new/page.tsx` within the **Company Information** section
- [ ] T024 [US2] Wire Deal Stage field into Admin Account Create form state and submit payload in `frontend/src/app/(admin)/accounts/new/page.tsx`
- [ ] T025 [US2] Add Deal Stage select control to Admin Account Detail inline edit Company Information form in `frontend/src/app/(admin)/accounts/[id]/page.tsx` (same section as other company fields)
- [ ] T026 [US2] Ensure Deal Stage value is displayed read-only in Admin Account Detail Company Information section when not editing

### Verification

- [ ] T027 [US2] Manually test changing Deal Stage across pipeline stages on Admin Account Detail page and verify persistence after reload

---

## Phase 5 – User Story 3: Basic User Visibility & Editing [P2]

Goal: Basic users can see and edit Lead Source and Deal Stage for accounts they are allowed to manage via the Company Information section.

### Backend (RBAC reuse)

- [ ] T028 [US3] Confirm existing RBAC rules for account updates already govern who can change account fields in `backend/src/Services/Accounts` (no new role logic, just reuse)

### Frontend – Basic My Accounts flows

- [ ] T029 [P] [US3] Ensure My Accounts account DTO in `frontend/src/lib/api.ts` includes `leadSource` and `dealStage`
- [ ] T030 [US3] Show read-only Lead Source and Deal Stage values in the **Company Information** section of Basic Account Detail page `frontend/src/app/(protected)/my-accounts/[id]/page.tsx`
- [ ] T031 [US3] Add Lead Source and Deal Stage selects to Basic Account Edit flow in `frontend/src/app/(protected)/my-accounts/[id]/page.tsx` inline company edit or `.../[id]/edit/page.tsx`, positioned near the other Company Information fields
- [ ] T032 [US3] Wire Basic edit selects into company form state and update payload (Lead Source and Deal Stage) in the relevant Basic account update call
- [ ] T033 [US3] Ensure that when a Basic user does not have edit rights on a particular account (if applicable), Lead Source and Deal Stage render as read-only values only

### Verification

- [ ] T034 [US3] Manually test a Basic user updating Lead Source and Deal Stage in My Accounts Company Information and verify persistence and permissions behavior

---

## Phase 6 – Theming & UX Consistency [P2]

Goal: New fields look and behave consistently with existing Company Information UI in both light and dark themes.

- [ ] T035 [P] Ensure Admin Company Information selects for Lead Source and Deal Stage in `frontend/src/app/(admin)/accounts/new/page.tsx` and `.../[id]/page.tsx` use TailAdmin/Tailwind classes with `dark:` variants, matching surrounding inputs
- [ ] T036 [P] Ensure Basic Company Information selects for Lead Source and Deal Stage in `frontend/src/app/(protected)/my-accounts/[id]/page.tsx` (and `.../[id]/edit/page.tsx` if used) use light-first styling with `dark:` variants consistent with Spec 013
- [ ] T037 Verify in-browser that all updated pages (Admin and Basic) render Lead Source and Deal Stage correctly in both light and dark modes

---

## Phase 7 – Polish & Cross-Cutting Concerns

- [ ] T038 Add or update any backend tests around account create/update to cover Lead Source and Deal Stage validation in `backend/tests` (if test project exists)
- [ ] T039 Add or update any frontend tests (if present) around Admin and Basic account forms/detail views to cover the new fields in `frontend/src/__tests__` or similar
- [ ] T040 Run full backend and frontend test/lint suites and fix issues
- [ ] T041 Update `specs/014-lead-source-deal-stage/quickstart.md` with step-by-step instructions for exercising Lead Source and Deal Stage flows
- [ ] T042 Final regression pass: verify existing account functionality (including CRM expiry, Spec 013 theming) remains intact

---

## Dependencies & Parallelization

- Foundational data/contract tasks (T003–T007) should complete before most user-story-specific tasks.  
- Many frontend DTO and options tasks are marked [P] and can be implemented in parallel once the enum keys are stable.  
- User Story 1 (Lead Source on Admin create) and User Story 2 (Deal Stage pipeline for Admin) are both P1 and can proceed after migrations and DTOs are ready.  
- User Story 3 (Basic flows) depends on backend work and DTOs but can be largely parallel to Admin UI wiring once the API shape is fixed.

## MVP Recommendation

- MVP = Complete **User Story 1 and User Story 2** for Admin flows (T008–T027) so that Admins can capture and manage Lead Source and Deal Stage on all accounts.  
- Follow-up iteration = Implement Basic user editing and theming polish (T028–T042).
