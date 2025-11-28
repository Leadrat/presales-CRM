# Tasks: Spec 17 – Universal Account Visibility & Created-By Attribution

**Input**: Design documents from `/specs/017-account-visibility-created-by/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/accounts-listing.md`, `quickstart.md`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm environment and branch for Spec 17

- [ ] T001 Ensure feature branch `017-account-visibility-created-by` is checked out in `c:/Users/shash/Desktop/Pre- Sales/`
- [ ] T002 [P] Verify backend solution builds successfully in `c:/Users/shash/Desktop/Pre- Sales/backend/`
- [ ] T003 [P] Verify frontend Next.js app builds successfully in `c:/Users/shash/Desktop/Pre- Sales/frontend/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Understand current Accounts list behavior and contracts

- [ ] T004 Review existing Accounts list endpoint implementation in `backend/Controllers/AccountsController.cs` to confirm current filtering, paging, and projection behavior
- [ ] T005 [P] Review existing account DTOs and models used for listing in `backend/Models` (e.g., `AccountDto` or equivalent) to see what fields are currently exposed
- [ ] T006 [P] Review frontend Accounts list implementations in `frontend/src/app/(admin)/accounts/page.tsx` and `frontend/src/app/(protected)/my-accounts/page.tsx` to document current columns, filters, and Created By behavior
- [ ] T007 Confirm `frontend/src/lib/api.ts` `AccountDto` type and `listAccounts` function shape matches the current `/api/Accounts` response

**Checkpoint**: Foundation ready – team understands current Accounts list behavior end-to-end.

---

## Phase 3: User Story 1 – Basic user can see all accounts (Priority: P1) 🎯 MVP

**Goal**: Basic users see the same full set of accounts as Admins in the Accounts list.

**Independent Test**: Log in as Basic and Admin users, open the Accounts page for both, and verify they see the same number of accounts and can open any account’s detail page.

### Implementation for User Story 1

- [ ] T010 [US1] Remove creator-based filtering from Basic Accounts list in `frontend/src/app/(protected)/my-accounts/page.tsx` so it uses the full `accounts` array from `listAccounts` (no filter by `createdByUserId`)
- [ ] T011 [P] [US1] Update any remaining labels or headings in `frontend/src/app/(protected)/my-accounts/page.tsx` from "My Accounts" to "Accounts" while keeping the route unchanged
- [ ] T012 [US1] Ensure row click navigation in `frontend/src/app/(protected)/my-accounts/page.tsx` continues to open `/my-accounts/[id]` for any account, regardless of creator
- [ ] T013 [P] [US1] Add or update a simple integration-style test or manual test notes in `specs/017-account-visibility-created-by/quickstart.md` describing how to compare Basic vs Admin visibility

**Checkpoint**: Basic users see identical account sets to Admin users in the list UI.

---

## Phase 4: User Story 2 – Created By attribution is clear (Priority: P1)

**Goal**: Show the creator’s current display name/username in the Created By column for each account.

**Independent Test**: For a known account, verify the Created By column matches the creator’s current display name; if the creator record is missing, Created By shows `Unknown`.

### Implementation for User Story 2

- [ ] T020 [US2] Extend the backend list DTO used by `/api/Accounts` in `backend/Models` (e.g., `AccountDto` or equivalent) to include a nullable `CreatedByUserDisplayName` field
- [ ] T021 [US2] Update the list query or service in `backend/Controllers/AccountsController.cs` (or its service dependency) to join `Accounts.CreatedByUserId` to `Users.Id` and populate `CreatedByUserDisplayName` from the user’s display name / full name
- [ ] T022 [P] [US2] Ensure the backend logic sets `CreatedByUserDisplayName` to `null` (not an error) when the creator record is missing or deleted, so the UI can render `Unknown`
- [ ] T023 [P] [US2] Update `AccountDto` type and `listAccounts` mapping in `frontend/src/lib/api.ts` to include an optional `createdByUserDisplayName?: string | null` property matching the backend contract
- [ ] T024 [US2] Wire the Basic Accounts list in `frontend/src/app/(protected)/my-accounts/page.tsx` to render the Created By column from `account.createdByUserDisplayName` with a fallback of `"Unknown"` when null/empty
- [ ] T025 [US2] Wire the Admin Accounts list in `frontend/src/app/(admin)/accounts/page.tsx` to render the Created By column from `account.createdByUserDisplayName` with a fallback of `"Unknown"` when null/empty
- [ ] T026 [P] [US2] Add or update backend integration tests around `/api/Accounts` (in `backend/Tests/Integration`) to assert `CreatedByUserDisplayName` is populated correctly and becomes `null` when the creator user is missing

**Checkpoint**: Both lists show a reliable Created By display name for each account.

---

## Phase 5: User Story 3 – Unified Accounts list for all roles (Priority: P2)

**Goal**: Provide a single, consistent Accounts list UI for both Basic and Admin users.

**Independent Test**: Compare the rendered Accounts tables for Basic and Admin; columns, ordering, styling, and actions should match, aside from any role-based restrictions handled elsewhere.

### Implementation for User Story 3

- [ ] T030 [US3] Ensure the Basic Accounts table in `frontend/src/app/(protected)/my-accounts/page.tsx` uses the unified column set: Company Name, Account Type, Size, City, Deal Stage, Created By, Created Date, Actions
- [ ] T031 [US3] Ensure the Admin Accounts table in `frontend/src/app/(admin)/accounts/page.tsx` uses the same unified column set and labels in the same order
- [ ] T032 [P] [US3] Verify the 3-dot Actions menu implementation (Edit/Delete) is consistent between Basic and Admin in `frontend/src/app/(protected)/my-accounts/page.tsx` and `frontend/src/app/(admin)/accounts/page.tsx`
- [ ] T033 [P] [US3] Update any page titles, breadcrumbs, and navigation labels in `frontend/src/app` that distinguish "My Accounts" vs "Accounts" so that users conceptually see a single "Accounts" list, while keeping routing changes minimal

**Checkpoint**: Basic and Admin experience a visually and behaviorally unified Accounts list.

---

## Phase 6: User Story 4 – Search, filters, and pagination continue to work (Priority: P3)

**Goal**: Ensure that existing search/pagination behavior (where implemented) works across all accounts after universal visibility and Created By changes.

**Independent Test**: With enough test accounts, verify that paging through the Accounts list, and any enabled search/filter mechanisms, operate over the entire account set.

### Implementation for User Story 4

- [ ] T040 [US4] Verify that pagination parameters for `/api/Accounts` (in `backend/Controllers/AccountsController.cs` or its query layer) still work correctly when returning all accounts and are not coupled to creator filtering
- [ ] T041 [P] [US4] Confirm that any existing search/filter query handling for `/api/Accounts` operates over the full account set and is not limited by `CreatedByUserId`
- [ ] T042 [P] [US4] If frontend search or filter interactions are enabled in `frontend/src/app/(admin)/accounts/page.tsx` or `frontend/src/app/(protected)/my-accounts/page.tsx`, validate that they call the unified listing behavior (no client-side ownership filters)

**Checkpoint**: Paging and any search/filter behavior are consistent with universal visibility.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements affecting multiple user stories

- [ ] T050 [P] Update `specs/017-account-visibility-created-by/quickstart.md` with any implementation nuances discovered during development
- [ ] T051 [P] Add or update brief documentation in `specs/017-account-visibility-created-by/plan.md` or project-level docs summarizing the universal visibility & Created By behavior for Accounts
- [ ] T052 Run a manual end-to-end validation of the Accounts list for both Basic and Admin users following the scenarios in `specs/017-account-visibility-created-by/spec.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies – can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion; BLOCKS all user story phases.
- **User Stories (Phases 3–6)**: Depend on Foundational phase completion.  
  - User Stories 1 and 2 (P1) should be implemented first; User Stories 3 and 4 can follow once they are stable.  
- **Polish (Final Phase)**: Depends on all required user stories being complete.

### User Story Dependencies

- **User Story 1 (US1, P1)**: No dependency on other stories; must complete to guarantee universal visibility.  
- **User Story 2 (US2, P1)**: Depends on backend and frontend structures from Phases 1–2; logically independent of US1 but should be tested together.  
- **User Story 3 (US3, P2)**: Depends on US1 and US2 for data and navigation; focuses on visual and behavioral unification.  
- **User Story 4 (US4, P3)**: Depends on US1–US3 so that search/paging can be validated over the final unified list.

### Parallel Opportunities

- Tasks marked **[P]** can be executed in parallel as long as they touch different files or layers.  
- Within Phase 2, backend review (T004–T005) and frontend review (T006–T007) can proceed concurrently.  
- In US2, backend projection tasks (T020–T022) and frontend DTO wiring (T023) can run in parallel once the contract shape is agreed.  
- In US3 and US4, Basic and Admin page adjustments can be split between different developers.

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1 (Setup).  
2. Complete Phase 2 (Foundational reviews).  
3. Implement Phase 3 (US1 – universal visibility for Basic users).  
4. Validate that Basic and Admin see the same number of accounts and can open any detail view.

### Incremental Delivery

1. After MVP (US1), implement US2 to surface Created By display names.  
2. Then apply US3 to fully unify the UI and actions.  
3. Finally, validate and refine search/pagination behavior under US4.  
4. Use Phase N tasks for documentation and final manual verification.
