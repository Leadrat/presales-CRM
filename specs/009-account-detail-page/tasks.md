# Tasks — Spec 9: Account Detail Page

## Phase 1 — Setup & Verification (Shared)

- [ ] T001 Verify backend connection string and EF Core migrations setup in `backend/Program.cs` and `backend/appsettings*.json`.
- [ ] T002 Verify existing Accounts, Users, and Roles models and RBAC behaviour in `backend/AppDbContext.cs` and `backend/Controllers/AccountsController.cs`.
- [ ] T003 Verify frontend auth wiring (`AuthContext`, `fetchWithAuth`, role-based landing) in `frontend/src/context/AuthContext.tsx`, `frontend/src/lib/api/fetchWithAuth.ts`, and `frontend/src/app/page.tsx`.

## Phase 2 — Foundational Data Model & Migrations (Shared)

- [ ] T004 Add `Contact` entity class with required properties and navigation properties to `backend/Models/Contact.cs`.
- [ ] T005 Add `Opportunity` entity class with required properties and navigation properties to `backend/Models/Opportunity.cs`.
- [ ] T006 Add `Activity` entity class with required properties and navigation properties to `backend/Models/Activity.cs`.
- [ ] T007 Add lookup entity classes `OpportunityStage`, `ActivityType`, and `ActivityStatus` to `backend/Models/OpportunityStage.cs`, `backend/Models/ActivityType.cs`, and `backend/Models/ActivityStatus.cs`.
- [ ] T008 Update `backend/AppDbContext.cs` to register `DbSet<Contact>`, `DbSet<Opportunity>`, `DbSet<Activity>`, `DbSet<OpportunityStage>`, `DbSet<ActivityType>`, and `DbSet<ActivityStatus>` and configure relationships/keys via Fluent API.
- [ ] T009 Create EF Core migration `AddContactsOpportunitiesActivities` in `backend/Migrations/` to create Contacts, Opportunities, Activities, and lookup tables with GUID PKs, FKs, TitleCase columns, and soft delete fields.
- [ ] T010 Seed initial lookup data (3–5 values each) for `OpportunityStages`, `ActivityTypes`, and `ActivityStatuses` in the `AddContactsOpportunitiesActivities` migration.
- [ ] T011 Apply migrations against the PostgreSQL database and verify new tables and seed data exist.
- [ ] T012 Update `docs/table-catalog.md` with definitions and relationships for Contacts, Opportunities, Activities, OpportunityStages, ActivityTypes, and ActivityStatuses.

## Phase 3 — User Story 1 (P1) — Admin views full account details

Goal: Admin can open `/accounts/[id]` and see account overview + non-deleted child counts.

- [ ] T013 [US1] Define a DTO/view model for account detail response (core account fields, resolved lookup names, child counts) in `backend/Models/Interfaces/AccountDetailDto.cs` (or equivalent DTO location).
- [ ] T014 [US1] Implement `GET /api/accounts/{id}/detail` handler (new action on `backend/Controllers/AccountsController.cs` or new `AccountDetailsController`) that:
  - Loads the account by Id (excluding soft-deleted) with required lookup joins.
  - Calculates `contactCount`, `opportunityCount`, and `activityCount` using only non-deleted child rows.
  - Returns the DTO from T013.
- [ ] T015 [US1] Implement 404 handling in the detail endpoint when the account does not exist or is soft-deleted.
- [ ] T016 [US1] Implement data integrity check in the detail endpoint for missing/inconsistent lookup rows (AccountType, AccountSize, CrmProvider) and return 500 with error code `ACCOUNT_DATA_INCONSISTENT` when detected.
- [ ] T017 [US1] Add backend tests or manual verification steps (in `specs/009-account-detail-page/quickstart.md`) to validate a sample Admin request to `/api/accounts/{id}/detail` returns the correct overview fields and child counts.
- [ ] T018 [US1] Add a frontend API helper function `getAccountDetail(accountId)` in `frontend/src/lib/api.ts` that calls `/api/accounts/{id}/detail` via `fetchWithAuth` and returns typed data.
- [ ] T019 [US1] Create Account Detail Page route file `frontend/src/app/(admin)/accounts/[id]/page.tsx` that:
  - Uses the route param `id` to call `getAccountDetail`.
  - Renders the Overview section fields (Company Name, Website, Account Type, Account Size, CRM Provider, CRM Expiry, NumberOfUsers, CreatedAt) and child counts.
- [ ] T020 [US1] Add navigation from the Accounts list page `frontend/src/app/(admin)/accounts/page.tsx` to the detail route (e.g., row click or "View" link to `/accounts/[id]`).

## Phase 4 — User Story 2 (P2) — RBAC and Basic user visibility

Goal: Basic users can only view detail for accounts they own, with minimal read-only layout and clear unauthorized handling.

- [ ] T021 [US2] Ensure the detail endpoint enforces RBAC: Admin can access any non-deleted account; Basic can only access accounts where `Accounts.CreatedByUserId == currentUserId`, returning 403 for others.
- [ ] T022 [US2] Update the frontend Account Detail Page `frontend/src/app/(admin)/accounts/[id]/page.tsx` to:
  - Detect the current user role via `useAuth()`.
  - Render Admin-only actions (Edit, Delete) only when `role === "Admin"`.
  - Render a minimal read-only layout (no edit/delete) for non-admin users.
- [ ] T023 [US2] Implement 403 handling in the frontend detail loader/component so that when `getAccountDetail` returns 403, the user is redirected to `/not-authorized`.
- [ ] T024 [US2] Add manual test steps or notes in `specs/009-account-detail-page/quickstart.md` verifying:
  - Basic user can view detail for accounts they own.
  - Basic user attempting to view someone else’s account is redirected to `/not-authorized`.

## Phase 5 — User Story 3 (P3) — Child modules foundation

Goal: Ensure schema and endpoint form a solid base for future Contacts, Opportunities, Activities CRUD specs.

- [ ] T025 [US3] Document the new child entities and lookup relationships in `specs/009-account-detail-page/data-model.md` (or extend existing data model), including ownership and soft delete.
- [ ] T026 [US3] Verify that the detail endpoint counts align with the new schema by inserting sample Contacts, Opportunities, and Activities rows and calling `/api/accounts/{id}/detail`.
- [ ] T027 [US3] Add notes in `specs/009-account-detail-page/quickstart.md` describing how future specs (Contacts/Opportunities/Activities CRUD) can reuse the new tables and the detail endpoint.

## Phase 6 — Polish & Cross-Cutting

- [ ] T028 Add logging around the detail endpoint in `backend/Controllers/AccountsController.cs` (or the chosen controller) to capture errors, 403/404/500 cases, and correlation IDs for debugging.
- [ ] T029 Ensure error responses from the detail endpoint conform to existing API error shape (e.g., `{ error: { code, message } }`) and document this in `specs/009-account-detail-page/contracts/`.
- [ ] T030 Review the Account Detail Page UI for responsive layout and basic accessibility (headings, link labels) in `frontend/src/app/(admin)/accounts/[id]/page.tsx`.
- [ ] T031 Run end-to-end manual tests for Admin and Basic users (login, navigate to Accounts list, open Account Detail, verify counts and RBAC behaviour) and capture findings in `specs/009-account-detail-page/quickstart.md`.
