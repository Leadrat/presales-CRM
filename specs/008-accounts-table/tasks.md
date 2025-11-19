# Tasks — Spec 8: Accounts Table

> All tasks use the checklist format: `- [ ] T001 [P] [US1] Description with file path`

## Phase 1 — Setup

- [ ] T001 Confirm backend project builds and EF Core tools are available in `c:/Users/shash/Desktop/Pre- Sales/backend`.
- [ ] T002 Verify connection string and migrations configuration for PostgreSQL in `c:/Users/shash/Desktop/Pre- Sales/backend/appsettings.Development.json` (or environment-specific config).

## Phase 2 — Foundational (Entities & DbContext)

- [ ] T010 Create `Account` entity with all Spec 8 fields in `c:/Users/shash/Desktop/Pre- Sales/backend/Models/Account.cs`.
- [ ] T011 Create `AccountType` entity in `c:/Users/shash/Desktop/Pre- Sales/backend/Models/AccountType.cs`.
- [ ] T012 Create `AccountSize` entity in `c:/Users/shash/Desktop/Pre- Sales/backend/Models/AccountSize.cs`.
- [ ] T013 Create `CrmProvider` entity in `c:/Users/shash/Desktop/Pre- Sales/backend/Models/CrmProvider.cs`.
- [ ] T014 Register `DbSet<Account>`, `DbSet<AccountType>`, `DbSet<AccountSize>`, `DbSet<CrmProvider>` in `c:/Users/shash/Desktop/Pre- Sales/backend/AppDbContext.cs`.
- [ ] T015 Configure relationships, keys, and `IsDeleted` soft-delete flag for `Account` via Fluent API in `c:/Users/shash/Desktop/Pre- Sales/backend/AppDbContext.cs`.

## Phase 3 — User Story 1 (US1): Core Accounts table

- [ ] T020 [US1] Generate EF Core migration to create `Accounts` table and lookup tables in `c:/Users/shash/Desktop/Pre- Sales/backend/Migrations/*_CreateAccountsAndLookups.cs`.
- [ ] T021 [US1] Ensure `Accounts` table columns match Spec 8 (GUID PKs, `CrmExpiry` as timestamptz, `IsDeleted`, audit fields) in the migration file under `c:/Users/shash/Desktop/Pre- Sales/backend/Migrations/`.
- [ ] T022 [US1] Configure foreign keys from `Accounts` to `Users`, `AccountTypes`, `AccountSizes`, and `CrmProviders` in the migration file.

## Phase 4 — User Story 2 (US2): Lookup seeding & reuse

- [ ] T030 [US2] Add deterministic seed data for `AccountTypes` in the migration `Up` method in `c:/Users/shash/Desktop/Pre- Sales/backend/Migrations/`.
- [ ] T031 [US2] Add deterministic seed data for `AccountSizes` in the migration `Up` method in `c:/Users/shash/Desktop/Pre- Sales/backend/Migrations/`.
- [ ] T032 [US2] Add deterministic seed data for `CrmProviders` in the migration `Up` method in `c:/Users/shash/Desktop/Pre- Sales/backend/Migrations/`.
- [ ] T033 [US2] Add corresponding `DeleteData` calls for seeded lookups in the migration `Down` method in `c:/Users/shash/Desktop/Pre- Sales/backend/Migrations/`.

## Phase 5 — User Story 3 (US3): Reporting & indexing

- [ ] T040 [US3] Add indexes for `Accounts.CreatedByUserId`, `Accounts.CurrentCrmId`, `Accounts.AccountTypeId`, and `Accounts.AccountSizeId` in the migration `Up` method under `c:/Users/shash/Desktop/Pre- Sales/backend/Migrations/`.
- [ ] T041 [US3] Ensure any added indexes are dropped in the migration `Down` method in `c:/Users/shash/Desktop/Pre- Sales/backend/Migrations/`.

## Phase 6 — Docs & Table Catalog

- [ ] T050 Update `docs/table-catalog.md` to document `Accounts`, `AccountTypes`, `AccountSizes`, and `CrmProviders` with key columns and relationships in `c:/Users/shash/Desktop/Pre- Sales/docs/table-catalog.md`.

## Phase 7 — QA / Verification & Polish

- [ ] T060 [P] Apply migrations against the dev PostgreSQL database using `dotnet ef database update` from `c:/Users/shash/Desktop/Pre- Sales/backend`.
- [ ] T061 [P] Verify seeded lookup rows in `AccountTypes`, `AccountSizes`, and `CrmProviders` via SQL client or psql connection to the dev DB.
- [ ] T062 [P] Manually insert or create several `Accounts` rows (via SQL or API) and confirm all foreign key constraints to `Users` and lookup tables pass.
- [ ] T063 [P] Run example join queries between `Accounts` and lookup tables filtering by `IsDeleted = false` to confirm indexes are used and results are correct.
